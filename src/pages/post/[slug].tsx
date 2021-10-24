import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <p className={styles.loading}>Carregando...</p>;
  }
  const { content } = post.data;

  const medianTime = () => {
    return Math.ceil(
      content.reduce((acc, contentItem) => {
        const bodyLength = RichText.asText(contentItem.body).split(' ').length;
        return acc + contentItem.heading.length + bodyLength;
      }, 0) / 200
    );
  };

  return (
    <>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={styles.icons}>
          <span>
            {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
              locale: ptBR,
            })}
          </span>
          <span>{post.data.author}</span>
          <span>{medianTime()} min</span>
        </div>
        {content.map((item, index) => {
          return (
            <div key={index} className={styles.contentItem}>
              <h2>{item.heading}</h2>
              {item.body.map((bodyItem, index) => {
                return <p key={index}>{bodyItem.text}</p>;
              })}
            </div>
          );
        })}
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const { results } = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 100,
    }
  );
  const uidsArr = results.map(item => {
    return {
      params: {
        slug: item.uid,
      },
    };
  });

  return {
    paths: uidsArr,
    fallback: true,
  };
};

export const getStaticProps = async context => {
  const {
    params: { slug },
  } = context;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});
  // TODO
  return {
    props: {
      post: response,
    },
  };
};
