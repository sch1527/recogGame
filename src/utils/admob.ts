import mobileAds, { InterstitialAd, AdEventType, TestIds, MaxAdContentRating } from 'react-native-google-mobile-ads';

// const AD_UNIT_ID = __DEV__
//   ? TestIds.INTERSTITIAL
//   : 'ca-app-pub-3892725863062404/8743348307';

  const AD_UNIT_ID = TestIds.INTERSTITIAL;

let initialized = false;
let interstitial: InterstitialAd | null = null;
let isLoaded = false;

export function initAds() {
  if (initialized) return;
  mobileAds().setRequestConfiguration({
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent: true,
    maxAdContentRating: MaxAdContentRating.G,
  }).then(() => mobileAds().initialize())
    .then(() => {
      initialized = true;
      preloadInterstitial();
    }).catch(() => {});
}

export function preloadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    isLoaded = false;
  });
  interstitial.load();
}

export function showInterstitial(onDismiss?: () => void) {
  if (!interstitial || !isLoaded) {
    onDismiss?.();
    return;
  }
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    onDismiss?.();
    preloadInterstitial();
  });
  interstitial.show();
}
