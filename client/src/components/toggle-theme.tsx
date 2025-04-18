import { FC, useMemo } from 'react';
import {
    makeStyles,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    tokens, ToolbarButton,
} from '@fluentui/react-components';
import {
    ChevronDownRegular,
    WeatherMoonFilled,
    WeatherSunnyRegular
} from '@fluentui/react-icons';
import { useTheme } from '../contexts/use-theme';

const useStyles = makeStyles({
    icon: {
        color: tokens.colorBrandForeground1,
    },
    button: {
        fontWeight: 'normal',
    }
});

export const ToggleTheme: FC = () => {
    const styles = useStyles();
    const { theme, setTheme } = useTheme();

    const themeButton = useMemo(() => {
        return {
            webLightTheme: { text: 'Light theme', icon: <WeatherSunnyRegular /> },
            webDarkTheme: { text: 'Dark theme', icon: <WeatherMoonFilled /> },
        }
    }, []);

    return <Menu>
        <MenuTrigger>
            <ToolbarButton className={styles.button} icon={themeButton[theme].icon}>
                {themeButton[theme].text} <ChevronDownRegular fontSize={20} />
            </ToolbarButton>
        </MenuTrigger>
        <MenuPopover>
            <MenuList>
                <MenuItem icon={themeButton.webLightTheme.icon}
                          onClick={() => setTheme('webLightTheme')}>
                    {themeButton.webLightTheme.text}
                </MenuItem>
                <MenuItem icon={themeButton.webDarkTheme.icon}
                          onClick={() => setTheme('webDarkTheme')}>
                    {themeButton.webDarkTheme.text}
                </MenuItem>
            </MenuList>
        </MenuPopover>
    </Menu>
}

export default ToggleTheme;