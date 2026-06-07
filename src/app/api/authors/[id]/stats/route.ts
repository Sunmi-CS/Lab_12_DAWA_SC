import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    }

    const books = author.books;
    const totalBooks = books.length;

    if (totalBooks === 0) {
      return NextResponse.json({
        authorId: author.id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      });
    }

    // Filter out books without a published year to safely calculate first/latest
    const booksWithYear = books.filter((b) => b.publishedYear !== null);
    
    // Sort by year
    booksWithYear.sort((a, b) => a.publishedYear! - b.publishedYear!);

    const firstBook = booksWithYear.length > 0 ? {
      title: booksWithYear[0].title,
      year: booksWithYear[0].publishedYear
    } : null;

    const latestBook = booksWithYear.length > 0 ? {
      title: booksWithYear[booksWithYear.length - 1].title,
      year: booksWithYear[booksWithYear.length - 1].publishedYear
    } : null;

    // Filter books with pages to calculate average, shortest, longest
    const booksWithPages = books.filter((b) => b.pages !== null);
    
    const averagePages = booksWithPages.length > 0 
      ? Math.round(booksWithPages.reduce((sum, b) => sum + b.pages!, 0) / booksWithPages.length) 
      : 0;

    booksWithPages.sort((a, b) => a.pages! - b.pages!);

    const shortestBook = booksWithPages.length > 0 ? {
      title: booksWithPages[0].title,
      pages: booksWithPages[0].pages
    } : null;

    const longestBook = booksWithPages.length > 0 ? {
      title: booksWithPages[booksWithPages.length - 1].title,
      pages: booksWithPages[booksWithPages.length - 1].pages
    } : null;

    // Extract unique genres, filtering out nulls
    const genresSet = new Set(books.map(b => b.genre).filter(Boolean));
    const genres = Array.from(genresSet);

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook,
      shortestBook,
    });
  } catch (error) {
    console.error("Error fetching author stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener estadísticas del autor" },
      { status: 500 }
    );
  }
}
