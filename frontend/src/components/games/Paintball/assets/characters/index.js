import SprinterPng from './CharacterPngs/Sprinter.png';
import GuardianPng from './CharacterPngs/Guardian.png';
import SharpshotPng from './CharacterPngs/Sharpshot.png';
import BlitzerPng from './CharacterPngs/Blitzer.png';

export const CHARACTER_CARDS = [
  {
    id: 'sprinter',
    name: 'Sprinter',
    ability: 'Speed Boost',
    description: 'Fast movement to reposition quickly.',
    color: '#38bdf8',
    sprite: SprinterPng
  },
  {
    id: 'guardian',
    name: 'Guardian',
    ability: 'Shield Wall',
    description: 'Hold ground with steady fire.',
    color: '#4ade80',
    sprite: GuardianPng
  },
  {
    id: 'sharpshot',
    name: 'Sharpshot',
    ability: 'Long Range',
    description: 'Accurate shots from afar.',
    color: '#f97316',
    sprite: SharpshotPng
  },
  {
    id: 'blitzer',
    name: 'Blitzer',
    ability: 'Rapid Fire',
    description: 'Quick bursts for close fights.',
    color: '#facc15',
    sprite: BlitzerPng
  }
];
