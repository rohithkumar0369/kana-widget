import { combineProviders } from 'utils/combineProviders';
import { ReactNode } from 'react';
import ReactQueryProvider from 'providers/ReactQueryProvider';
import I18nProvider from 'providers/I18nProvider';

const AppProviders = ({ children }: { children?: ReactNode }) =>
    combineProviders(
        [
            // order matters here, be careful!
            // if Provider A is using another Provider B, then A needs to appear below B.
            I18nProvider,
            ReactQueryProvider,
        ],
        children
    );

export default AppProviders;