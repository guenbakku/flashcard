/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollectionCreator } from 'rxdb';

export const collectionFactory = <
  K extends string,
  C extends RxCollectionCreator<any>,
>(
  name: K,
  collectionCreator: C | (() => C),
) => () => {
  type ActualCreator = C extends (...args: any[]) => infer R ? R : C;
  type InferredDocType = ExtractDocumentTypeFromTypedRxJsonSchema<ActualCreator['schema']>;

  return {
    [name]: toValue(collectionCreator),
  } as unknown as { [P in K]: RxCollectionCreator<InferredDocType> };
};
