"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Book, Author } from "@prisma/client";

type BookWithAuthor = Book & { author: { name: string } };

export default function BooksPage() {
  const [books, setBooks] = useState<BookWithAuthor[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter States
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,       
    limit: 10,     
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookWithAuthor | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isbn: "",
    publishedYear: "",
    genre: "",
    pages: "",
    authorId: "",
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/authors");
      if (res.ok) {
        const data = await res.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
      });

      if (search) queryParams.append("search", search);
      if (genre) queryParams.append("genre", genre);
      if (authorName) queryParams.append("authorName", authorName);

      const res = await fetch(`/api/books/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.data);
        setPagination(data.pagination);
        
        // Extract genres dynamically from the fetched data if we haven't loaded them globally
        // A better approach would be an API endpoint for genres, but this works for now.
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, genre, authorName, sortBy, order]);

  // Load authors once
  useEffect(() => {
    fetchAuthors();
    // Also try to get all unique genres. For simplicity, we could just fetch a large set of books or use predefined.
    // Assuming genres are predefined or we just collect them from what we see.
    setGenres(["Novela", "Ficción", "Ciencia Ficción", "Fantasía", "Terror", "Misterio", "Historia", "Ensayo", "Biografía", "Poesía"]);
  }, []);

  // Fetch books on param change
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1); // Reset page on new search
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
    const method = editingBook ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : null,
          pages: formData.pages ? parseInt(formData.pages) : null,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingBook(null);
        setFormData({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "", authorId: "" });
        fetchBooks();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar el libro");
      }
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Error inesperado al guardar el libro");
    }
  };

  const handleEdit = (book: BookWithAuthor) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      description: book.description || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear ? book.publishedYear.toString() : "",
      genre: book.genre || "",
      pages: book.pages ? book.pages.toString() : "",
      authorId: book.authorId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este libro?")) return;

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchBooks();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar el libro");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Libros</h1>
          <p className="text-zinc-500 mt-1">
            {pagination.total > 0 ? `Mostrando resultados ${((page - 1) * limit) + 1} - ${Math.min(page * limit, pagination.total)} de ${pagination.total}` : "Cargando..."}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBook(null);
            setFormData({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "", authorId: authors.length > 0 ? authors[0].id : "" });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          Añadir Libro
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar por título (tiempo real)..." 
            onChange={handleSearchChange}
            className="pl-10 w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            value={genre} 
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los géneros</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select 
            value={authorName} 
            onChange={(e) => { setAuthorName(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los autores</option>
            {authors.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt">Fecha de creación</option>
            <option value="title">Título</option>
            <option value="publishedYear">Año de publicación</option>
          </select>

          <select 
            value={order} 
            onChange={(e) => { setOrder(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      {/* Results Area */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 font-semibold text-sm">Título</th>
                <th className="py-3 px-4 font-semibold text-sm">Autor</th>
                <th className="py-3 px-4 font-semibold text-sm">Género</th>
                <th className="py-3 px-4 font-semibold text-sm">Año</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No se encontraron libros que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium">{book.title}</div>
                      {book.isbn && <div className="text-xs text-zinc-500">ISBN: {book.isbn}</div>}
                    </td>
                    <td className="py-3 px-4">{book.author.name}</td>
                    <td className="py-3 px-4">
                      {book.genre ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {book.genre}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4">{book.publishedYear || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(book)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-md transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(book.id)}
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

        {/* Pagination Controls */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500">
            Página {pagination.page} de {pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full my-8 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{editingBook ? "Editar Libro" : "Nuevo Libro"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Autor *</label>
                  <select
                    name="authorId"
                    value={formData.authorId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Selecciona un autor</option>
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Género</label>
                  <input 
                    type="text" 
                    name="genre" 
                    value={formData.genre} 
                    onChange={handleInputChange} 
                    list="genre-options"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="genre-options">
                    {genres.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ISBN</label>
                  <input 
                    type="text" 
                    name="isbn" 
                    value={formData.isbn} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Año</label>
                    <input 
                      type="number" 
                      name="publishedYear" 
                      value={formData.publishedYear} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Páginas</label>
                    <input 
                      type="number" 
                      name="pages" 
                      value={formData.pages} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {editingBook ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
