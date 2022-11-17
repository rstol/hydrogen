import {
  defer,
  type LinksFunction,
  type LoaderFunction,
  type MetaFunction,
} from '@shopify/hydrogen-remix';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useMatches,
} from '@remix-run/react';
import {Layout} from '~/components';
import {getCart, getLayoutData, getCountries} from '~/data';
import {GenericError} from './components/GenericError';
import {NotFound} from './components/NotFound';
import {getSession} from './lib/session.server';
import {Seo, Debugger} from './lib/seo';

import styles from './styles/app.css';
import favicon from '../public/favicon.svg';

export const handle = {
  // @todo - remove any and type the seo callback
  seo: (data: any) => ({
    title: data.layout.shop.name,
    bypassTitleTemplate: true,
    titleTemplate: `%s | ${data.layout.shop.name}`,
  }),
};

export const links: LinksFunction = () => {
  return [
    {rel: 'stylesheet', href: styles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  viewport: 'width=device-width,initial-scale=1',
});

export const loader: LoaderFunction = async function loader({
  request,
  context,
  params,
}) {
  const session = await getSession(request, context);
  const cartId = await session.get('cartId');

  return defer({
    layout: await getLayoutData(context, params),
    countries: getCountries(context),
    cart: cartId ? getCart(context, {cartId, params}) : undefined,
  });
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <Seo />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout data={data}>
          <Outlet />
        </Layout>
        <Debugger />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function CatchBoundary() {
  const [root] = useMatches();
  const caught = useCatch();
  const isNotFound = caught.status === 404;

  return (
    <html lang="en">
      <head>
        <title>{isNotFound ? 'Not found' : 'Error'}</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout data={root.data as any}>
          {isNotFound ? (
            <NotFound type={caught.data?.pageType} />
          ) : (
            <GenericError
              error={{message: `${caught.status} ${caught.data}`}}
            />
          )}
        </Layout>
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({error}: {error: Error}) {
  const [root] = useMatches();

  return (
    <html lang="en">
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout data={root.data as any}>
          <GenericError error={error} />
        </Layout>
        <Scripts />
        <Debugger />
      </body>
    </html>
  );
}