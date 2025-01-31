import algoliasearch from 'algoliasearch'
import { firestore } from '../firebase'
import env from '../env'

export function initIndex(indexName: string) {
  const algolia = algoliasearch(env.algolia.appId, env.algolia.apiKey)
  return algolia.initIndex(indexName)
}

export async function removeObject(objectID: string) {
  const index = initIndex('profiles')
  await index.deleteObject(objectID)
}

export function profileToAlgolia(profile: any, cache: any) {
  return {
    objectID: profile.id,
    id: profile.id,
    username: profile.username,
    photo: profile.photo,
    height: profile.height,
    weight: profile.weight,
    bio: profile.bio,
    locales: Object.keys(profile.locales),
    place: profile.place,
    country: cache.cities[profile.place].location.country,
    locality: cache.cities[profile.place].location.locality,
    styles: profile.styles,
    style: profile.styles ? Object.keys(profile.styles) : [],
    partner: profile.partner,
    objectives: profile.objectives ? Object.keys(profile.objectives) : [],
    gender: profile.gender,
    type: profile.type,
    visibility: profile.visibility,
    permission: profile.permission,
    lastLoginAt: profile.lastLoginAt,
    createdAt: profile.createdAt,
    daysUsed: profile.daysUsed,
    _tags: profile.styles ? Object.keys(profile.styles) : [],
    _geoloc: {
      lat: cache.cities[profile.place].location.latitude,
      lng: cache.cities[profile.place].location.longitude
    }
  }
}

export async function indexProfiles() {
  const cache = (
    await firestore
      .collection('app')
      .doc('v2')
      .get()
  ).data() as any

  const index = initIndex('profiles')

  const profileDocs = (await firestore.collection('profiles').get()).docs
  const objects = []

  for (const doc of profileDocs) {
    const profile = {
      id: doc.id,
      ...doc.data()
    } as any

    if (!profile.username || !profile.place) {
      await index.deleteObject(profile.id)
      continue
    }

    objects.push(profileToAlgolia(profile, cache))
  }

  await index.saveObjects(objects)
}
