import "server-only";

type PinterestPinPayload = {
  board_id: string;
  link: string;
  title: string;
  description: string;
  alt_text: string;
  media_source: {
    source_type: "image_url";
    url: string;
    is_standard: true;
  };
};

type PinterestCreatePinResponse = {
  id?: string;
  link?: string;
  message?: string;
  code?: number;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

export function buildPinterestPinPayload(input: {
  boardId: string;
  destinationUrl: string;
  imageUrl: string;
  title: string;
  description: string;
}): PinterestPinPayload {
  return {
    board_id: input.boardId,
    link: input.destinationUrl,
    title: input.title.slice(0, 100),
    description: input.description.slice(0, 500),
    alt_text: input.title.slice(0, 500),
    media_source: {
      source_type: "image_url",
      url: input.imageUrl,
      is_standard: true,
    },
  };
}

export async function createPinterestPinForResource(input: {
  detailHref: string;
  imageUrl: string;
  title: string;
  metadata: Record<string, unknown>;
}) {
  const accessToken = clean(process.env.PINTEREST_ACCESS_TOKEN);
  const boardId = clean(process.env.PINTEREST_BOARD_ID);
  if (!accessToken || !boardId) {
    throw new Error(
      "Pinterest promotion requires PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID.",
    );
  }

  const pinterest =
    input.metadata.pinterest &&
    typeof input.metadata.pinterest === "object" &&
    !Array.isArray(input.metadata.pinterest)
      ? (input.metadata.pinterest as Record<string, unknown>)
      : {};

  const titles = arrayOfStrings(pinterest.titles);
  const descriptions = arrayOfStrings(pinterest.descriptions);

  const payload = buildPinterestPinPayload({
    boardId,
    destinationUrl: input.detailHref,
    imageUrl: input.imageUrl,
    title: titles[0] || input.title,
    description:
      descriptions[0] ||
      "A printable homeschool worksheet from MyLearna, with answers included.",
  });

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as PinterestCreatePinResponse;
  if (!response.ok) {
    throw new Error(
      body.message ||
        `Pinterest Create Pin failed with HTTP ${response.status}.`,
    );
  }

  return {
    pinId: clean(body.id),
    pinLink: clean(body.link),
    payload,
  };
}
