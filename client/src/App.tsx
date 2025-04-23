import SettingsDialog from "./components/settings-dialog.tsx";
import ToggleTheme from "@/components/toggle-theme.tsx";
import FilesGrid from "@/components/files-layout/grid.tsx";
import { makeStyles } from "@fluentui/react-components";
import { useAuth } from "@/auth-context.tsx";

const useStyles = makeStyles({
    root: {
        padding: '20px 32px 20px 24px',
    },
});

function App() {
    const classes = useStyles();
    const auth = useAuth();

    return (
        <>
            <header className={classes.root}>
                <nav>
                    {auth.authenticatedBy === 'ip' && <SettingsDialog />}
                    <ToggleTheme />
                </nav>
            </header>
            <FilesGrid />
        </>
    )
}

export default App
