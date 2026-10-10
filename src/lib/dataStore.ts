import bcrypt from 'bcryptjs';
import { initialContent, initialEpisodes, SeedContent, SeedEpisode } from './initialData';

export interface StoreUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  watchlist: string[];
  createdAt: string;
}

// In-memory global store to survive Next.js module reload in dev
declare global {
  // eslint-disable-next-line no-var
  var __reelbeat_store__: {
    users: StoreUser[];
    content: SeedContent[];
    episodes: SeedEpisode[];
    initialized: boolean;
  } | undefined;
}

function initStore() {
  if (global.__reelbeat_store__ && global.__reelbeat_store__.initialized) {
    return global.__reelbeat_store__;
  }

  const defaultAdminPassword = process.env.ADMIN_PASSWORD || '';
  const salt = bcrypt.genSaltSync(10);
  const adminHash = defaultAdminPassword ? bcrypt.hashSync(defaultAdminPassword, salt) : '';
  const userHash = bcrypt.hashSync('User@ReelBeat2026', salt);

  const initialUsers: StoreUser[] = [
    {
      _id: 'usr-admin-1',
      name: process.env.ADMIN_NAME || 'Administrator',
      email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
      passwordHash: adminHash,
      role: 'admin',
      watchlist: [],
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'usr-demo-1',
      name: 'Cinema Fan',
      email: 'viewer@reelbeat.com',
      passwordHash: userHash,
      role: 'user',
      watchlist: ['m-bolly-1', 's-bolly-1'],
      createdAt: new Date().toISOString(),
    },
  ];

  global.__reelbeat_store__ = {
    users: initialUsers,
    content: JSON.parse(JSON.stringify(initialContent)),
    episodes: JSON.parse(JSON.stringify(initialEpisodes)),
    initialized: true,
  };

  return global.__reelbeat_store__;
}

export const dataStore = {
  getStore() {
    return initStore();
  },

  // USERS
  getUserByEmail(email: string): StoreUser | undefined {
    const store = initStore();
    return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(id: string): StoreUser | undefined {
    const store = initStore();
    return store.users.find((u) => u._id === id);
  },

  createUser(userData: Omit<StoreUser, '_id' | 'createdAt'>): StoreUser {
    const store = initStore();
    const newUser: StoreUser = {
      ...userData,
      _id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      watchlist: userData.watchlist || [],
    };
    store.users.push(newUser);
    return newUser;
  },

  toggleWatchlist(userId: string, contentId: string): string[] {
    const store = initStore();
    const user = store.users.find((u) => u._id === userId);
    if (!user) return [];
    if (!user.watchlist) user.watchlist = [];
    const idx = user.watchlist.indexOf(contentId);
    if (idx >= 0) {
      user.watchlist.splice(idx, 1);
    } else {
      user.watchlist.push(contentId);
    }
    return user.watchlist;
  },

  // CONTENT
  getContentList(filters: {
    type?: string;
    industry?: string;
    genre?: string;
    search?: string;
    year?: number;
    sort?: string;
    page?: number;
    limit?: number;
    isPublished?: boolean;
  }) {
    const store = initStore();
    let items = [...store.content];

    if (filters.isPublished !== undefined) {
      items = items.filter((c) => c.isPublished === filters.isPublished);
    }

    if (filters.type) {
      items = items.filter((c) => c.type.toLowerCase() === filters.type!.toLowerCase());
    }

    if (filters.industry) {
      items = items.filter(
        (c) => c.industry.toLowerCase() === filters.industry!.toLowerCase()
      );
    }

    if (filters.genre) {
      const g = filters.genre.toLowerCase();
      items = items.filter((c) =>
        c.genre.some((item) => item.toLowerCase().includes(g))
      );
    }

    if (filters.year) {
      items = items.filter((c) => c.year === Number(filters.year));
    }

    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.cast.some((actor) => actor.toLowerCase().includes(query)) ||
          c.genre.some((g) => g.toLowerCase().includes(query)) ||
          c.industry.toLowerCase().includes(query) ||
          (c.remixName && c.remixName.toLowerCase().includes(query))
      );
    }

    // Sorting
    if (filters.sort === 'latest') {
      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filters.sort === 'rating') {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sort === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (filters.sort === 'year') {
      items.sort((a, b) => b.year - a.year);
    } else {
      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 24);
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      total,
      page,
      totalPages,
    };
  },

  getContentById(id: string): SeedContent | undefined {
    const store = initStore();
    return store.content.find((c) => c._id === id);
  },

  createContent(
    contentData: Omit<SeedContent, '_id' | 'createdAt' | 'rating' | 'views'>
  ): SeedContent {
    const store = initStore();
    const newContent: SeedContent = {
      ...contentData,
      _id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      rating: 8.5,
      views: 0,
      createdAt: new Date().toISOString(),
    };
    store.content.unshift(newContent);
    return newContent;
  },

  updateContent(id: string, updates: Partial<SeedContent>): SeedContent | null {
    const store = initStore();
    const idx = store.content.findIndex((c) => c._id === id);
    if (idx === -1) return null;
    store.content[idx] = { ...store.content[idx], ...updates };
    return store.content[idx];
  },

  deleteContent(id: string): boolean {
    const store = initStore();
    const initialLen = store.content.length;
    store.content = store.content.filter((c) => c._id !== id);
    store.episodes = store.episodes.filter((e) => e.seriesId !== id);
    return store.content.length < initialLen;
  },

  // EPISODES
  getEpisodesBySeriesId(seriesId: string): SeedEpisode[] {
    const store = initStore();
    return store.episodes
      .filter((e) => e.seriesId === seriesId)
      .sort((a, b) => a.season - b.season || a.episodeNumber - b.episodeNumber);
  },

  createEpisode(episodeData: Omit<SeedEpisode, '_id' | 'createdAt'>): SeedEpisode {
    const store = initStore();
    const newEp: SeedEpisode = {
      ...episodeData,
      _id: `ep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    store.episodes.push(newEp);

    // Update parent series episodes count
    const series = store.content.find((c) => c._id === episodeData.seriesId);
    if (series) {
      series.episodesCount = (series.episodesCount || 0) + 1;
      if (episodeData.season > (series.seasonsCount || 1)) {
        series.seasonsCount = episodeData.season;
      }
    }
    return newEp;
  },

  getStats() {
    const store = initStore();
    const movies = store.content.filter((c) => c.type === 'movie').length;
    const songs = store.content.filter((c) => c.type === 'song').length;
    const series = store.content.filter((c) => c.type === 'series').length;
    const episodes = store.episodes.length;
    const recentUploads = store.content
      .slice()
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);

    const bollywood = store.content.filter((c) => c.industry === 'bollywood').length;
    const hollywood = store.content.filter((c) => c.industry === 'hollywood').length;
    const bhojpuri = store.content.filter((c) => c.industry === 'bhojpuri').length;
    const tollywood = store.content.filter((c) => c.industry === 'tollywood').length;
    const srajenDj = store.content.filter((c) => c.industry === 'srajen-dj').length;

    const totalStorageBytes = [...store.content, ...store.episodes].reduce(
      (acc, item: any) => acc + (item.fileSize || 0),
      0
    );

    const formatBytes = (bytes: number) => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return {
      movies,
      songs,
      series,
      episodes,
      totalContent: store.content.length,
      byType: { movie: movies, song: songs, series: series, episodes },
      byIndustry: { bollywood, hollywood, bhojpuri, tollywood, 'srajen-dj': srajenDj },
      srajenDjSongs: srajenDj,
      totalStorageBytes,
      totalStorageFormatted: formatBytes(totalStorageBytes),
      recentUploads,
    };
  },
};
