import contentful, { type EntryFieldTypes } from "contentful";

export type BlogPost = {
    contentTypeId: "blogPost",
    fields: {
      title: EntryFieldTypes.Text
      description: EntryFieldTypes.Text,
      relativePath: EntryFieldTypes.Text
      date: EntryFieldTypes.Date,
      body: EntryFieldTypes.RichText,

    }
  }

export const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});