import SettingsDialog from "./components/settings-dialog.tsx";
import ToggleTheme from "@/components/toggle-theme.tsx";
import FilesGrid from "@/components/files-layout/grid.tsx";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
    root: {
        padding: '20px 32px 20px 24px',
    },
});

function App() {
    const classes = useStyles();

    return (
        <>
            <header className={classes.root}>
                <nav>
                    <SettingsDialog />
                    <ToggleTheme />
                </nav>
            </header>
            <FilesGrid />
        </>
    )
}

export default App
