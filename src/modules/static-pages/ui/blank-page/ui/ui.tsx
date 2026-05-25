import Link from 'next/link';

import { BLANK_PAGE_COPY } from '../constants/constants';
import { BLANK_PAGE_STYLES } from '../styles/styles';
import type { BlankPageProps } from '../types/types';

export function BlankPage({ viewModel }: BlankPageProps) {
  return (
    <main style={BLANK_PAGE_STYLES.root}>
      <section style={BLANK_PAGE_STYLES.shell}>
        <span style={BLANK_PAGE_STYLES.badge}>{viewModel.status}</span>
        <h1 style={BLANK_PAGE_STYLES.title}>{viewModel.title}</h1>
        <p style={BLANK_PAGE_STYLES.description}>{viewModel.description}</p>
        <span style={BLANK_PAGE_STYLES.route}>
          {BLANK_PAGE_COPY.routeLabel}: {viewModel.href}
        </span>
        {viewModel.routeParamLabel ? (
          <p style={BLANK_PAGE_STYLES.param}>{viewModel.routeParamLabel}</p>
        ) : null}
        <nav style={BLANK_PAGE_STYLES.navigation}>
          <h2 style={BLANK_PAGE_STYLES.navigationTitle}>{viewModel.navigationTitle}</h2>
          <p style={BLANK_PAGE_STYLES.navigationHint}>{viewModel.navigationHint}</p>
          <div style={BLANK_PAGE_STYLES.grid}>
            {viewModel.navigation.map((item) => (
              <Link key={item.href} href={item.href} style={BLANK_PAGE_STYLES.link}>
                <span>{item.title}</span>
                <span>{BLANK_PAGE_COPY.navigationArrow}</span>
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </main>
  );
}
