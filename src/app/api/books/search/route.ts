import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 5);
    const limitParam = parseInt(searchParams.get("limit") || "5", 5);
    const limit = Math.min(Math.max(limitParam, 1), 50); // limit between 1 and 50
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const authorName = searchParams.get("authorName");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["title", "publishedYear", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    // Build the `where` clause
    const where: Prisma.BookWhereInput = {};

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (genre) {
      where.genre = genre;
    }

    if (authorName) {
      where.author = {
        name: {
          contains: authorName,
          mode: "insensitive",
        },
      };
    }

    // Execute queries in parallel
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortField]: order,
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al buscar libros" },
      { status: 500 }
    );
  }
}
