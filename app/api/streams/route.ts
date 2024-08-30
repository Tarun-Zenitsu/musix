import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import ytdl from "ytdl-core";

// Regular expression to validate YouTube URLs
const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

// Zod schema for validating incoming requests
const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

// Function to extract the YouTube video ID from various URL formats
function extractYouTubeID(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// POST handler for adding a new stream
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the incoming request data
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = YT_REGEX.test(data.url);

    if (!isYt) {
      return NextResponse.json(
        { message: "Wrong URL format" },
        { status: 411 }
      );
    }

    // Extract the YouTube video ID from the URL
    const extractedId = extractYouTubeID(data.url);

    if (!extractedId) {
      return NextResponse.json(
        { message: "Could not extract YouTube ID" },
        { status: 411 }
      );
    }

    // Fetch video information using ytdl-core
    const videoInfo = await ytdl.getInfo(extractedId);
    const title = videoInfo.videoDetails.title;
    const thumbnail =
      videoInfo.videoDetails.thumbnails.pop()?.url || "default-thumbnail.jpg"; // Provide a default thumbnail URL if none exists

    // Create a new stream entry in the database
    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title,
        thumbnail,
      },
    });

    return NextResponse.json(
      {
        message: "Stream added successfully",
        id: stream.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error while adding a stream" },
      { status: 411 }
    );
  }
}

// GET handler for retrieving streams by creator ID
export async function GET(req: NextRequest): Promise<NextResponse> {
  const creatorId = req.nextUrl.searchParams.get("creatorId");

  if (!creatorId) {
    return NextResponse.json(
      { message: "No creatorId provided" },
      { status: 400 }
    );
  }

  const streams = await prismaClient.stream.findMany({
    where: {
      userId: creatorId,
    },
  });

  console.log("Found streams:", streams);

  return NextResponse.json({ streams });
}
