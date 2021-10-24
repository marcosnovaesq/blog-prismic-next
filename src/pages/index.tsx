import { GetStaticProps } from 'next';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Link from 'next/link';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState(results || []);
  const [nextPage, setNextPage] = useState(next_page || 'no-page');

  const onClick = async () => {
    const response = await fetch(next_page);
    const body = await response.json();
    const newPosts = body.results.map(post => {
      return {
        uid: post.slugs[0],
        data: post.data,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM uuuu',
          { locale: ptBR }
        ),
      } as Post;
    });
    setPosts(prev => [...prev, ...newPosts]);
    setNextPage(body.nextPage ?? 'no-page');
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <ul>
          {posts.map((value: Post) => {
            return (
              <Link key={value.uid} href={`/post/${value.uid}`}>
                <li>
                  <h2>{value.data.title}</h2>
                  <p>{value.data.subtitle}</p>
                  <div>
                    <span>{value.first_publication_date}</span>
                    <span>{value.data.author}</span>
                  </div>
                </li>
              </Link>
            );
          })}
        </ul>
        {nextPage !== 'no-page' ? (
          <button className={styles.button} onClick={onClick}>
            Carregar mais posts
          </button>
        ) : null}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.author', 'post.subtitle'],
      pageSize: 1,
    }
  );
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page ?? 'no-page',
        results: postsResponse.results.map(post => {
          return {
            uid: post.slugs[0],
            data: post.data,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM uuuu',
              { locale: ptBR }
            ),
          } as Post;
        }),
      },
    },
    revalidate: 60 * 60,
  };
};
