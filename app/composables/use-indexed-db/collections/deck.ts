import { toTypedRxJsonSchema } from 'rxdb';

import type { InferRxCollection } from '~/types';

import { collectionFactory } from '../helpers';

const schema = {
  title: 'deck schema',
  version: 2,
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
    masteredCount: {
      type: 'number',
      minimum: 0,
    },
    lastStudied: {
      type: 'integer',
      minimum: 0,
    },
    createdAt: {
      type: 'integer',
      minimum: 0,
    },
  },
  required: ['id', 'name', 'cardCount', 'masteredCount', 'createdAt'],
  indexes: ['createdAt'],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('deck', {
  schema: typedSchema,
  migrationStrategies: {
    1: (doc) => {
      const { masteredCards: _delete, ...rest } = doc;
      return {
        ...rest,
        masteredCount: 0,
      };
    },
    2: (doc) => {
      return {
        ...doc,
        lastStudied: new Date(doc.lastStudied).getTime(),
        createdAt: new Date(doc.createdAt).getTime(),
      };
    },
  },
});

export function hook(db: InferRxCollection<ReturnType<typeof factory>>) {
  db.deck.postCreate(function (plainData, rxDocument) {
    Object.defineProperty(rxDocument, 'progress', {
      get: function () {
        return plainData.cardCount ? Math.round(plainData.masteredCount / plainData.cardCount * 100) : 0;
      },
    });
  });
};

export default factory;
