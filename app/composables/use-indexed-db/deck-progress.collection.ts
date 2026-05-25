import { toTypedRxJsonSchema } from 'rxdb';

import { collectionFactory } from './utils';

const schema = {
  title: 'deck-progress schema',
  version: 0,
  description: 'Deck progress stored in indexedDB',
  type: 'object',
  primaryKey: 'identifier',
  properties: {
    identifier: {
      type: 'string',
      maxLength: 128,
    },
    lastStudied: {
      anyOf: [
        { type: 'string', format: 'date-time' },
        { type: 'null' },
      ],
    },
    masteredCards: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
  },
  required: ['identifier', 'lastStudied', 'masteredCards'],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('deckprogress', {
  schema: typedSchema,
});

export default factory;
