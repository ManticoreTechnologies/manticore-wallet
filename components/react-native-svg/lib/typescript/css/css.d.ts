import * as React from 'react';
import { Component } from 'react';
import type { Middleware, UriProps, UriState, XmlProps, XmlState } from 'react-native-svg';
/**
 * Moves + merges styles from style elements to element styles
 *
 * Options
 *   useMqs (default: ['', 'screen'])
 *     what media queries to be used
 *     empty string element for styles outside media queries
 *
 *   usePseudos (default: [''])
 *     what pseudo-classes/-elements to be used
 *     empty string element for all non-pseudo-classes and/or -elements
 *
 * @param {Object} document document element
 *
 * @author strarsis <strarsis@gmail.com>
 * @author modified by: msand <msand@abo.fi>
 */
export declare const inlineStyles: Middleware;
export declare function SvgCss(props: XmlProps): React.JSX.Element | null;
export declare function SvgCssUri(props: UriProps): React.JSX.Element | null;
export declare class SvgWithCss extends Component<XmlProps, XmlState> {
    state: {
        ast: null;
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: {
        xml: string | null;
    }): void;
    parse(xml: string | null): void;
    render(): React.JSX.Element;
}
export declare class SvgWithCssUri extends Component<UriProps, UriState> {
    state: {
        xml: null;
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: {
        uri: string | null;
    }): void;
    fetch(uri: string | null): Promise<void>;
    render(): React.JSX.Element;
}
//# sourceMappingURL=css.d.ts.map