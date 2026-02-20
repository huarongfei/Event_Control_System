import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Match from '../models/Match.js';
import Joi from 'joi';
import { SportType, MatchStatus, PeriodType } from '../../../shared/types/index.js';
import { socketManager } from '../app.js';

const createMatchSchema = Joi.object({
  name: Joi.string().required(),
  sport: Joi.string().valid(...Object.values(SportType)).required(),
  homeTeam: Joi.object({
    name: Joi.string().required(),
    logo: Joi.string().uri().optional(),
    primaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#FF0000'),
    jerseyColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#FF0000')
  }).required(),
  awayTeam: Joi.object({
    name: Joi.string().required(),
    logo: Joi.string().uri().optional(),
    primaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#0000FF'),
    jerseyColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#0000FF')
  }).required(),
  venue: Joi.string().optional(),
  startTime: Joi.date().iso().required(),
  settings: Joi.object({
    periodDuration: Joi.number().min(1).default(720),
    overtimeDuration: Joi.number().min(1).default(300),
    maxFouls: Joi.number().min(1).default(5),
    timeoutsPerHalf: Joi.number().min(0).default(3),
    shotClockDuration: Joi.number().min(1).default(24)
  }).optional()
});

const updateMatchSchema = Joi.object({
  name: Joi.string().optional(),
  venue: Joi.string().optional(),
  startTime: Joi.date().iso().optional(),
  settings: Joi.object({
    periodDuration: Joi.number().min(1).optional(),
    overtimeDuration: Joi.number().min(1).optional(),
    maxFouls: Joi.number().min(1).optional(),
    timeoutsPerHalf: Joi.number().min(0).optional(),
    shotClockDuration: Joi.number().min(1).optional()
  }).optional()
});

export const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createMatchSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const match = new Match(value);
    await match.save();

    socketManager.broadcastToRole('director', 'match:created', {
      match: match.toObject(),
      createdBy: req.user?.username
    });

    res.status(201).json({
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const sport = req.query.sport as string;
    const search = req.query.search as string;

    const query: any = {};
    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      query.status = status;
    }
    if (sport && Object.values(SportType).includes(sport as SportType)) {
      query.sport = sport;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'homeTeam.name': { $regex: search, $options: 'i' } },
        { 'awayTeam.name': { $regex: search, $options: 'i' } }
      ];
    }

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit),
      Match.countDocuments(query)
    ]);

    res.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const match = await Match.findById(id);

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({ match });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateMatchSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const match = await Match.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    socketManager.broadcastToMatch(id, 'match:updated', {
      match: match.toObject(),
      updatedBy: req.user?.username
    });

    res.json({
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const match = await Match.findByIdAndDelete(id);

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    socketManager.broadcastToRole('director', 'match:deleted', {
      matchId: id,
      deletedBy: req.user?.username
    });

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMatchStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(MatchStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const match = await Match.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    socketManager.broadcastToMatch(id, 'match:status-updated', {
      matchId: id,
      status,
      updatedBy: req.user?.username,
      timestamp: new Date()
    });

    res.json({
      message: 'Match status updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const lockMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;

    const match = await Match.findByIdAndUpdate(
      id,
      { $set: { isLocked } },
      { new: true }
    );

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    socketManager.broadcastToMatch(id, 'match:lock-status-updated', {
      matchId: id,
      isLocked,
      updatedBy: req.user?.username
    });

    res.json({
      message: `Match ${isLocked ? 'locked' : 'unlocked'} successfully`,
      match
    });
  } catch (error) {
    console.error('Lock match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
