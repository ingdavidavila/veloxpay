import { CommonActions } from '@react-navigation/native';

// Send the user back to the signed-out part of the app.
//
// navigation.replace('Login') is NOT enough: it swaps only the top screen and
// leaves Dashboard (or whichever authenticated screen you came from) sitting
// underneath, so pressing Back walks straight into it while signed out.
// A reset throws the whole stack away and rebuilds it.
//
// Landing stays at index 0 so Login's own "Back" button still has somewhere to
// go, and index 1 puts Login on top as the screen the user actually sees.
export const resetToAuth = (navigation) => {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'Landing' }, { name: 'Login' }],
    })
  );
};

export default resetToAuth;
