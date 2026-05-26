import { toTypedRxJsonSchema } from 'rxdb';

import { collectionFactory } from './utils';

const schema = {
  title: 'card schema',
  version: 0,
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
  },
  required: ['id', 'deckId', 'front', 'back', 'order'],
} as const;

const typedSchema = toTypedRxJsonSchema(schema);

const factory = collectionFactory('card', {
  schema: typedSchema,
});

export default factory;
