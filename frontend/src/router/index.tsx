import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Album } from '../pages/Album';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

export function AppRouter() {
  return <Routes><Route element={<MainLayout />}><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/albums/:id" element={<Album />} /></Route></Routes>;
}
