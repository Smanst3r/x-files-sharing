import { makeStyles, tokens } from "@fluentui/react-components";

export const useCommonStyles = makeStyles({
    errorText: {
        color: 'red',
        fontSize: '0.875rem',
        marginTop: '0.5rem',
    },
    textSuccess: {
        color: tokens.colorPaletteGreenForeground1
    },
    textDanger: {
        color: tokens.colorPaletteRedForeground1,
        ':hover': {
            color: tokens.colorPaletteRedForeground1,
        }
    }
});

export default useCommonStyles;