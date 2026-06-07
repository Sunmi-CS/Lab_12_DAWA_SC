import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los libros de un autor específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Corregido a Promise para Next.js moderno
) {
  try {
    // Es obligatorio resolver params asíncronamente antes de usar sus propiedades
    const resolvedParams = await params;

    // Verificar que el autor existe usando el parámetro resuelto
    const author = await prisma.author.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener los libros del autor
    const books = await prisma.book.findMany({
      where: { authorId: resolvedParams.id },
      orderBy: {
        publishedYear: 'desc'
      }
    })

    return NextResponse.json({
      author: {
        id: author.id,
        name: author.name,
      },
      totalBooks: books.length,
      books
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener libros del autor' },
      { status: 500 }
    )
  }
}