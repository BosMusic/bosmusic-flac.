 
import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
const BASE = 'https://api.jamendo.com/v3.0';

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

async function jamendo(params) {
  if (!CLIENT_ID) {
    throw new Error('JAMENDO_CLIENT_ID not configured');
  }

  const url = new URL(BASE + '/tracks/');
  const options = {
    client_id: CLIENT_ID,
    format: 'json',
    ...params
  };

  for (const [key, value] of Object.entries(options)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error('Jamendo HTTP ' + response.status);
  }

  const data = await response.json();

  if (data.headers?.status !== 'success') {
    throw new Error(
      data.headers?.error_message || 'Jamendo API error'
    );
  }

  return data.results || [];
}

const manifest = {
  id: 'org.bosmusic.jamendo',
  name: 'BosMusic Jamendo',
  version: '0.2.0',
  description: 'Jamendo music streaming for BitChord',
  resources: ['search', 'stream'],
  types: ['track'],
  catalogs: [],
  allowDownloads: 0,
  checkValidLossless: 1
};

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');

    if (u.pathname === '/health') {
      return send(res, 200, {
        ok: true,
        configured: !!CLIENT_ID,
        version: '0.2.0'
      });
    }

    if (u.pathname === '/' ||
        u.pathname === '/manifest.json') {
      return send(res, 200, manifest);
    }

    if (u.pathname === '/search') {
      const q = u.searchParams.get('q') ||
                u.searchParams.get('query');

      if (!q?.trim()) {
        return send(res, 400, {
          error: 'Search query required'
        });
      }

      const results = await jamendo({
        search: q.trim(),
        limit: '30',
        audioformat: 'mp32'
      });

      return send(res, 200, {
        tracks: results.map(t => ({
          id: String(t.id),
          title: t.name,
          artist: t.artist_name || '',
          album: t.album_name || '',
          duration: Number(t.duration) || 0,
          artworkURL: t.image || t.album_image || null,
          format: 'mp3',
          audioQuality: 'HIGH'
        }))
      });
    }

    const match = u.pathname.match(/^\/stream\/(\d+)$/);
    const id = match?.[1] || (
      u.pathname === '/stream'
        ? u.searchParams.get('id')
        : null
    );

    if (id && /^\d+$/.test(id)) {
      const results = await jamendo({
        id,
        limit: '1',
        audioformat: 'mp32'
      });

      const t = results[0];

      if (!t?.audio) {
        return send(res, 404, {
          error: 'Playable track not found'
        });
      }

      return send(res, 200, {
        url: t.audio,
        format: 'mp3',
        codec: 'mp3',
        container: 'mp3',
        manifest: 'none',
        encrypted: false,
        quality: 'Jamendo MP3'
      });
    }

    return send(res, 404, {
      error: 'not found'
    });

  } catch (e) {
    console.error(e);
    return send(res, 500, {
      error: e.message
    });
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('BosMusic v0.2.0 running on ' + PORT);
});
