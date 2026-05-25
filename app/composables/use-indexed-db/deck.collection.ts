import { toTypedRxJsonSchema } from 'rxdb';

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
  },
  required: ['id', 'name', 'cardCount', 'masteredCards'],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('deck', {
  schema: typedSchema,
});

export default factory;
