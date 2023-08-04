export const gameQuery = `
  query GameAnimes($excludeIds: String) {
    animes(order: random, limit: 50, excludeIds: $excludeIds) {
      id
      russian
      screenshots {
        id
        originalUrl
      }
    }
  }
`;

export const screenshotsQuery = `
  query AnimeScreenshots($ids: String) {
    animes(ids: $ids, limit: 50) {
      id
      screenshots {
        id
        originalUrl
      }
    }
  }
`;

export const decoyQuery = `
  query DecoyAnimes($excludeIds: String) {
    animes(order: random, limit: 50, excludeIds: $excludeIds) {
      id
      russian
    }
  }
`;
