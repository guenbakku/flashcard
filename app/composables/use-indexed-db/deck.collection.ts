import { toTypedRxJsonSchema } from 'rxdb';

import type { InferRxDatabase } from '~/types';

import { collectionFactory } from './utils';

const schema = {
  title: 'deck schema',
  version: 0,
  description: 'Deck info stored in indexedDB',
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: {
      type: 'string',
      maxLength: 128,
    },
    name: {
      type: 'string',
      maxLength: 128,
    },
    description: {
      type: 'string',
      maxLength: 128,
    },
    cardCount: {
      type: 'number',
      minimum: 0,
    },
    lastStudied: {
      type: 'string',
      format: 'date-time',
    },
    masteredCards: {
      type: 'object',
      additionalProperties: {
        type: 'boolean',
      },
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['id', 'name', 'cardCount', 'masteredCards', 'createdAt'],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('deck', {
  schema: typedSchema,
});

export const hook = (db: InferRxDatabase<ReturnType<typeof factory>>) => {
  db.deck.postCreate(function (plainData, rxDocument) {
    Object.defineProperty(rxDocument, 'progress', {
      get: function () {
        return plainData.cardCount ? Math.round((Object.keys(plainData.masteredCards).length / plainData.cardCount) * 100) : 0;
      },
    });
  });
};

export default factory;
