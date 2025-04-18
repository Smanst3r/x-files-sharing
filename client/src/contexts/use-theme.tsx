import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme, Theme } from '@fluentui/react-components';

webLightTheme.fontFamilyBase = '"Roboto", sans-serif';
webDarkTheme.fontFamilyBase = '"Roboto", sans-serif';

const themes = {
    webLightTheme: webLightTheme,
    webDarkTheme: webDarkTheme,
};

export type TThemes = {
    webLightTheme: Theme,
    webDarkTheme: Theme,
}

export type TThemeName = keyof TThemes;

type ThemeContextType = {
    theme: TThemeName;
    setTheme: Dispatch<SetStateAction<TThemeName>>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<TThemeName>(() => {
        const storedTheme = localStorage.getItem('theme') as TThemeName | null;
        return storedTheme && storedTheme in themes ? storedTheme : 'webLightTheme';
    });

    // workaround to apply theme to body tag
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.body.style.backgroundColor = theme.toLocaleLowerCase().includes('dark') ? '#292929' : '#ffffff';

        return () => {
            document.body.style.backgroundColor = '';
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <FluentProvider theme={themes[theme]}>
                {children}
            </FluentProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}