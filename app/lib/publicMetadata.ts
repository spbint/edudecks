import type { Metadata } from "next";

export const PUBLIC_SITE_URL = "https://www.mylearna.com";
export const PUBLIC_OG_IMAGE_URL = `${PUBLIC_SITE_URL}/branding/mylearna-logo.png`;

type PublicMetadataInput = {
  description: string;
  path: string;
  title: string;
};

export function buildPublicMetadata({
  title,
  description,
  path,
}: PublicMetadataInput): Metadata {
  const url = new URL(path, PUBLIC_SITE_URL).toString();

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "MyLearna",
      images: [
        {
          url: PUBLIC_OG_IMAGE_URL,
          width: 1916,
          height: 821,
          alt: "MyLearna",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [PUBLIC_OG_IMAGE_URL],
    },
  };
}
