import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Album } from '../pages/Album';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Profile } from '../pages/Profile';
import { CreateAlbum } from '../pages/CreateAlbum';
import { AdminUsers } from '../pages/AdminUsers';
import { ModerationAlbums } from '../pages/ModerationAlbums';

export function AppRouter() {
  return <Routes><Route element={<MainLayout />}><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/profile" element={<Profile />} /><Route path="/admin/users" element={<AdminUsers />} /><Route path="/moderation/albums" element={<ModerationAlbums />} /><Route path="/albums/new" element={<CreateAlbum />} /><Route path="/albums/:id/edit" element={<CreateAlbum />} /><Route path="/albums/:id" element={<Album />} /></Route></Routes>;
}
