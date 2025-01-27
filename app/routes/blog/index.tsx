import * as React from 'react'
import { json, Link, LoaderFunction, useLoaderData } from 'remix'
import {
  extractFrontMatter,
  fetchRepoFile,
  markdownToMdx,
} from '~/utils/documents.server'
import { getPostList } from '~/utils/blog'
import { DocTitle } from '~/components/DocTitle'
import { Mdx } from '~/components/Mdx'
import { format } from 'date-fns'
import { DefaultErrorBoundary } from '~/components/DefaultErrorBoundary'
import { Footer } from '~/components/Footer'

export const loader: LoaderFunction = async (context) => {
  const postInfos = getPostList()
  const frontMatters = await Promise.all(
    postInfos.map(async (info) => {
      const filePath = `app/blog/${info.id}.md`

      const file = await fetchRepoFile(
        'tanstack/tanstack.com',
        'main',
        filePath,
        process.env.NODE_ENV === 'development'
      )

      if (!file) {
        throw new Error('file not found')
      }

      const frontMatter = extractFrontMatter(file)

      const mdx = await markdownToMdx(frontMatter.excerpt ?? '')

      return [
        info.id,
        {
          title: frontMatter.data.title,
          published: frontMatter.data.published,
          exerptCode: mdx.code,
        },
      ]
    })
  )

  return json(frontMatters)
}

export const ErrorBoundary = DefaultErrorBoundary

export default function RouteReactTableDocs() {
  const frontMatters = useLoaderData() as [
    string,
    { title: string; published: string; exerptCode: string }
  ][]

  return (
    <div>
      <div className="p-4 lg:p-6 min-h-screen">
        <div>
          <DocTitle>Latest Posts</DocTitle>
          <div className="h-4" />
          <div className="h-px bg-gray-500 opacity-20" />
          <div className="h-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {frontMatters.map(([id, { title, published, exerptCode }]) => {
            return (
              <Link
                to={`${id}`}
                className={`border-2 border-transparent rounded-lg p-4 md:p-8
              transition-all bg-white dark:bg-gray-900
              shadow-xl dark:shadow-lg dark:shadow-blue-500/30
              hover:border-blue-500
              `}
              >
                <div className={`text-lg font-extrabold `}>{title}</div>
                {published ? (
                  <div className={`italic font-light mt-2`}>
                    {format(new Date(published), 'MMM dd, yyyy')}
                  </div>
                ) : null}
                <div className={`text-sm mt-2 text-black dark:text-white`}>
                  <Mdx code={exerptCode} />
                </div>
                <div className="h-4" />
                <div className="text-blue-500 uppercase font-black text-sm">
                  Read More
                </div>
              </Link>
            )
          })}
        </div>
        <div className="h-24" />
      </div>
      <Footer />
    </div>
  )
}
