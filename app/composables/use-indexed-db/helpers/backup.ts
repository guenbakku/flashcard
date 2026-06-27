/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRxDatabase as basedIsRxDatabase, type RxDatabase } from 'rxdb';

export async function exportJson<MyDatabase = RxDatabase>(db: MyDatabase) {
  if (!isRxDatabase(db)) {
    throw new Error('Not a RxDatabase instance');
  }

  const jsonData = await db.exportJSON();

  const schemaVersions = Object.values(db.collections).map(collection => ({
    name: collection.name,
    version: collection.schema.version,
  }));

  Object.assign(jsonData, { schemaVersions });

  return jsonData;
};

// TODO: re-consider the performance (memory usage...) when import large data set.
export async function importJson<MyDatabase = RxDatabase>(db: MyDatabase, jsonData: any) {
  if (!isRxDatabase(db)) {
    throw new Error('Not a RxDatabase instance');
  }

  // Completely empty all existing collections
  await Promise.all(Object.values(db.collections).map(collection => collection.find().remove()));

  try {
    await (db as RxDatabase).importJSON(jsonData);
  } catch (err) {
    if (isSchemaMismatchError(err)) {
      await importWithMigration(db, jsonData);
    } else {
      throw err;
    }
  }
};

function isRxDatabase(obj: unknown): obj is RxDatabase {
  return basedIsRxDatabase(obj);
};

function isSchemaMismatchError(error: unknown) {
  if (error instanceof Error) {
    return error.name.trim() === 'RxError (JD2)';
  }
  return false;
}

/**
 * Import data with schema migration support
 *
 * Inserts documents in bulk, applying migrations based on schema version differences
 *
 * @param db - RxDatabase instance
 * @param jsonData - Exported JSON data containing schemaVersions and collection documents
 */
async function importWithMigration(db: RxDatabase, jsonData: any) {
  if (!jsonData.schemaVersions || !Array.isArray(jsonData.schemaVersions)) {
    throw new Error('Invalid import data: missing schemaVersions');
  }

  const incomingVersionMap = new Map<string, number>(jsonData.schemaVersions.map((v: any) => [v.name, v.version]));

  // For each collection in the database
  for (const [collectionName, collection] of Object.entries(db.collections)) {
    const currentVersion = collection.schema.version;
    const incomingVersion = incomingVersionMap.get(collectionName) ?? currentVersion;

    // Get documents for this collection from JSON data
    const collectionData = jsonData.collections?.find((c: any) => c.name === collectionName);
    const documents = collectionData?.docs;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      continue;
    }

    // Prepare migrated documents for bulk insert
    const migratedDocs = documents.map((doc) => {
      let migratedDoc = doc;

      if (incomingVersion < currentVersion) {
        const migrations = collection.migrationStrategies;

        if (!migrations) {
          console.warn(
            `No migration strategies found for collection "${collectionName}". `
            + 'Document will be inserted as-is.',
          );
        } else {
          // Apply migrations sequentially from incoming version to current version
          for (let version = incomingVersion + 1; version <= currentVersion; version++) {
            const migrationFn = migrations[version];

            if (migrationFn) {
              migratedDoc = migrationFn(migratedDoc, collection);
            }
          }
        }
      }

      return migratedDoc;
    });

    // Remove all empty migrated documents
    // and then bulk insert all migrated documents
    await collection.bulkInsert(migratedDocs.filter(doc => !!doc));
  }
}
