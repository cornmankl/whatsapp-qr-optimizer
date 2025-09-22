// Vercel serverless function entry point
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'WhatsApp QR Optimizer API is running' });
}