import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://lunoraai.online',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://lunoraai.online/terms-and-conditions',
      lastModified: new Date(),
    },
    {
      url: 'https://lunoraai.online/privacy-policy',
      lastModified: new Date(),
    },
     {
      url: 'https://lunoraai.online/tools/flashcardmaker',
      lastModified: new Date(),
    },	

    {
      url: 'https://lunoraai.online/tools/study-planner',
      lastModified: new Date(),
    }
  ]
}