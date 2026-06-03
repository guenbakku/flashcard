import { toTypedRxJsonSchema } from 'rxdb';

import { collectionFactory } from '../helpers';

const schema = {
  title: 'card schema',
  version: 1,
  description: 'Card info stored in indexedDB',
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: {
      type: 'string',
      maxLength: 128,
    },
    deckId: {
      type: 'string',
      maxLength: 128,
    },
    front: {
      type: 'string',
      maxLength: 64,
    },
    back: {
      type: 'string',
      maxLength: 64,
    },
    backSub: {
      type: 'string',
      maxLength: 64,
    },
    order: {
      type: 'number',
    },
    isMastered: {
      type: 'boolean',
      default: false,
    },
  },
  required: ['id', 'deckId', 'front', 'back', 'order', 'isMastered'],
  indexes: [
    ['deckId', 'order'],
    ['deckId', 'isMastered'],
  ],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('card', {
  schema: typedSchema,
  migrationStrategies: {
    1: (doc) => {
      doc.isMastered = false;
      return doc;
    },
  },
});

export default factory;
