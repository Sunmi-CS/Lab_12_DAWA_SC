"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Author, Book } from "@prisma/client";

interface AuthorStats {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
}

export default function AuthorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [author, setAuthor] = useState<Author | null>(null);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [authorFormData, setAuthorFormData] = useState({
    name: "",
    email: "",
    bio: "",
    nationality: "",
    birthYear: "",
  });

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: "",
    description: "",
    isbn: "",
    publishedYear: "",
    genre: "",
    pages: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Author Details and Books
      const authorRes = await fetch(`/api/authors/${id}`);
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        setAuthor(authorData);
        setBooks(authorData.books || []);
      }

      // Fetch Stats
      const statsRes = await fetch(`/api/authors/${id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Author Edit Handlers
  const handleAuthorEditClick = () => {
    if (!author) return;
    setAuthorFormData({
      name: author.name,
      email: author.email,
      bio: author.bio || "",
      nationality: author.nationality || "",
      birthYear: author.birthYear ? author.birthYear.toString() : "",
    });
    setIsAuthorModalOpen(true);
  };

  const handleAuthorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authorFormData,
          birthYear: authorFormData.birthYear ? parseInt(authorFormData.birthYear) : null,
        }),
      });

      if (res.ok) {
        setIsAuthorModalOpen(false);
        fetchData(); // Refresh all data
      } else {
        const data = await res.json();
        alert(data.error || "Error al actualizar autor");
      }
    } catch (error) {
      console.error("Error saving author:", error);
    }
  };

  // Book CRUD Handlers
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
    const method = editingBook ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookFormData,
          authorId: id, // Force this author
          publishedYear: bookFormData.publishedYear ? parseInt(bookFormData.publishedYear) : null,
          pages: bookFormData.pages ? parseInt(bookFormData.pages) : null,
        }),
      });

      if (res.ok) {
        setIsBookModalOpen(false);
        setEditingBook(null);
        fetchData(); // Refresh data to update stats and list
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar el libro");
      }
    } catch (error) {
      console.error("Error saving book:", error);
    }
  };

  const handleBookEdit = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      description: book.description || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear ? book.publishedYear.toString() : "",
      genre: book.genre || "",
      pages: book.pages ? book.pages.toString() : "",
    });
    setIsBookModalOpen(true);
  };

  const handleBookDelete = async (bookId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este libro?")) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!author) {
    return <div className="text-center py-12 text-zinc-500">Autor no encontrado</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header and Basic Info */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{author.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {author.email}
              </span>
              {author.nationality && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {author.nationality}
                </span>
              )}
              {author.birthYear && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {author.birthYear}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleAuthorEditClick}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
            Editar Perfil
          </button>
        </div>
        
        {author.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Biografía</h3>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{author.bio}</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Estadísticas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
              <span className="block text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.totalBooks}</span>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Libros Publicados</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-center">
              <span className="block text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{stats.averagePages || 0}</span>
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Páginas Promedio</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30 text-center">
              <span className="block text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.genres.length}</span>
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Géneros Diferentes</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-xl border border-amber-100 dark:border-amber-800/30 text-center">
              <span className="block text-xl font-bold text-amber-600 dark:text-amber-400 truncate mb-1">
                {stats.firstBook ? `${stats.firstBook.year} - ${stats.latestBook?.year}` : "N/A"}
              </span>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Años Activo</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {stats.longestBook && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Libro más largo</span>
                  <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{stats.longestBook.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold">{stats.longestBook.pages}</span>
                  <span className="text-sm text-zinc-500 ml-1">págs</span>
                </div>
              </div>
            )}
            {stats.shortestBook && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Libro más corto</span>
                  <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{stats.shortestBook.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold">{stats.shortestBook.pages}</span>
                  <span className="text-sm text-zinc-500 ml-1">págs</span>
                </div>
              </div>
            )}
          </div>
          {stats.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-zinc-500 self-center mr-2">Géneros explorados:</span>
              {stats.genres.map(g => (
                <span key={g} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Books List Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Obras del Autor
          </h2>
          <button 
            onClick={() => {
              setEditingBook(null);
              setBookFormData({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "" });
              setIsBookModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Añadir Libro
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 font-semibold text-sm">Título</th>
                <th className="py-3 px-4 font-semibold text-sm">Género</th>
                <th className="py-3 px-4 font-semibold text-sm">Año</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Este autor aún no tiene libros registrados.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-blue-600 dark:text-blue-400">{book.title}</div>
                      {book.pages && <div className="text-xs text-zinc-500">{book.pages} páginas</div>}
                    </td>
                    <td className="py-3 px-4">{book.genre || "-"}</td>
                    <td className="py-3 px-4">{book.publishedYear || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleBookEdit(book)}
                          className="p-1.5 text-zinc-500 hover:text-blue-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-md transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleBookDelete(book.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-800 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Author Modal */}
      {isAuthorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full my-8 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Editar Autor</h2>
              <button onClick={() => setIsAuthorModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleAuthorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input type="text" name="name" value={authorFormData.name} onChange={(e) => setAuthorFormData({...authorFormData, name: e.target.value})} required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" name="email" value={authorFormData.email} onChange={(e) => setAuthorFormData({...authorFormData, email: e.target.value})} required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nacionalidad</label>
                <input type="text" name="nationality" value={authorFormData.nationality} onChange={(e) => setAuthorFormData({...authorFormData, nationality: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Año de Nacimiento</label>
                <input type="number" name="birthYear" value={authorFormData.birthYear} onChange={(e) => setAuthorFormData({...authorFormData, birthYear: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Biografía</label>
                <textarea name="bio" value={authorFormData.bio} onChange={(e) => setAuthorFormData({...authorFormData, bio: e.target.value})} rows={3} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAuthorModalOpen(false)} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full my-8 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{editingBook ? "Editar Libro" : "Nuevo Libro"}</h2>
              <button onClick={() => setIsBookModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleBookSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input type="text" value={bookFormData.title} onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})} required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Género</label>
                  <input type="text" value={bookFormData.genre} onChange={(e) => setBookFormData({...bookFormData, genre: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ISBN</label>
                  <input type="text" value={bookFormData.isbn} onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Año</label>
                  <input type="number" value={bookFormData.publishedYear} onChange={(e) => setBookFormData({...bookFormData, publishedYear: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Páginas</label>
                  <input type="number" value={bookFormData.pages} onChange={(e) => setBookFormData({...bookFormData, pages: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea value={bookFormData.description} onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">{editingBook ? "Actualizar" : "Guardar Libro"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
