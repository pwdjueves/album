import { Link } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { albumService } from '../services/album.service';
import type { Album } from '../types/album';

export function AlbumCard({ album, voteCount, voted = false, rank, actions, onVoteChange }: {
  album: Album; voteCount: number; voted?: boolean; rank?: number; actions?: ReactNode; onVoteChange?: () => void;
}) {
  const { user } = useAuth();
  const [isVoted, setIsVoted] = useState(voted);
  const [count, setCount] = useState(voteCount);
  const [busy, setBusy] = useState(false);
  async function toggleVote() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (isVoted) {
        await albumService.removeVote(album.id);
        setIsVoted(false);
        setCount((value) => Math.max(0, value - 1));
      } else {
        const result = await albumService.vote(album.id);
        setIsVoted(true);
        setCount(result.votes);
      }
      onVoteChange?.();
    } finally {
      setBusy(false);
    }
  }
  return <article className="album-card"><div className="album-card__top"><span className="rank-badge">#{rank ?? '-'}</span><span className="votes">♥ {count} votos</span></div><h3>{album.title}</h3><p>{album.description || 'Sin descripción'}</p><span className="category-tag">{album.category?.name ?? 'Sin categoría'}</span><div className="album-card__actions"><Link className="button secondary" to={`/albums/${album.id}`}>Ver álbum</Link><button className={`button vote-button ${isVoted ? 'is-voted' : ''}`} type="button" disabled={!user || busy} onClick={() => void toggleVote()}>{isVoted ? '♥ Votado' : '♡ Upvote'}</button></div>{!user && <small className="auth-hint">Inicia sesión para votar</small>}{actions}</article>;
}
