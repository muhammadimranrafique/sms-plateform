import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './student.service';

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listStudents(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const getById = async (req: AuthRequest, res: Response) => {
  const student = await service.getStudent(Number(req.params.id));
  res.json(ok(student));
};

export const create = async (req: AuthRequest, res: Response) => {
  const student = await service.createStudent(req.body, req.user!, req.id);
  res.status(201).json(created(student));
};

export const update = async (req: AuthRequest, res: Response) => {
  const student = await service.updateStudent(Number(req.params.id), req.body, req.user!);
  res.json(ok(student));
};

export const remove = async (req: AuthRequest, res: Response) => {
  await service.deleteStudent(Number(req.params.id), req.user!);
  res.status(204).send();
};
