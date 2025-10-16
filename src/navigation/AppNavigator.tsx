import React, { useEffect, useRef, useMemo } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme, Theme, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform, Animated, StatusBar, TouchableOpacity, View, Text, AppState, Easing, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../styles/colors';
import { HeaderVisibility } from '../contexts/HeaderVisibility';
import { Stream } from '../types/streams';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import ToastManager from 'toastify-react-native';
import { PostHogProvider } from 'posthog-react-native';

// Optional iOS Glass effect (expo-glass-effect) with safe fallback
let GlassViewComp: any = null;
let liquidGlassAvailable = false;
if (Platform.OS === 'ios') {
  try {
    // Dynamically require so app still runs if the package isn't installed yet
    const glass = require('expo-glass-effect');
    GlassViewComp = glass.GlassView;
    liquidGlassAvailable = typeof glass.isLiquidGlassAvailable === 'function' ? glass.isLiquidGlassAvailable() : false;
  } catch {
    GlassViewComp = null;
    liquidGlassAvailable = false;
  }
}

// Import screens with their proper types
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import MetadataScreen from '../screens/MetadataScreen';
import KSPlayerCore from '../components/player/KSPlayerCore';
import AndroidVideoPlayer from '../components/player/AndroidVideoPlayer';
import CatalogScreen from '../screens/CatalogScreen';
import AddonsScreen from '../screens/AddonsScreen';
import SearchScreen from '../screens/SearchScreen';
import ShowRatingsScreen from '../screens/ShowRatingsScreen';
import CatalogSettingsScreen from '../screens/CatalogSettingsScreen';
import StreamsScreen from '../screens/StreamsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import MDBListSettingsScreen from '../screens/MDBListSettingsScreen';
import TMDBSettingsScreen from '../screens/TMDBSettingsScreen';
import HomeScreenSettings from '../screens/HomeScreenSettings';
import HeroCatalogsScreen from '../screens/HeroCatalogsScreen';
import TraktSettingsScreen from '../screens/TraktSettingsScreen';
import PlayerSettingsScreen from '../screens/PlayerSettingsScreen';
import ThemeScreen from '../screens/ThemeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import AccountManageScreen from '../screens/AccountManageScreen';
import { useAccount } from '../contexts/AccountContext';
import { LoadingProvider, useLoading } from '../contexts/LoadingContext';
import PluginsScreen from '../screens/PluginsScreen';
import CastMoviesScreen from '../screens/CastMoviesScreen';
import UpdateScreen from '../screens/UpdateScreen';
import AISettingsScreen from '../screens/AISettingsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import BackdropGalleryScreen from '../screens/BackdropGalleryScreen';
import BackupScreen from '../screens/BackupScreen';

// Stack navigator types
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Backup: undefined;
  Home: undefined;
  Library: undefined;
  Settings: undefined;
  Update: undefined;
  Search: undefined;
  Calendar: undefined;
  Metadata: { 
    id: string; 
    type: string;
    episodeId?: string;
    addonId?: string;
  };
  Streams: { 
    id: string; 
    type: string;
    episodeId?: string;
    episodeThumbnail?: string;
    fromPlayer?: boolean;
  };
  PlayerIOS: { 
    uri: string; 
    title?: string; 
    season?: number; 
    episode?: number; 
    episodeTitle?: string; 
    quality?: string; 
    year?: number; 
    streamProvider?: string;
    streamName?: string;
    headers?: { [key: string]: string };
    forceVlc?: boolean;
    id?: string;
    type?: string;
    episodeId?: string;
    imdbId?: string;
    availableStreams?: { [providerId: string]: { streams: any[]; addonName: string } };
    backdrop?: string;
    videoType?: string;
  };
  PlayerAndroid: { 
    uri: string; 
    title?: string; 
    season?: number; 
    episode?: number; 
    episodeTitle?: string; 
    quality?: string; 
    year?: number; 
    streamProvider?: string;
    streamName?: string;
    headers?: { [key: string]: string };
    forceVlc?: boolean;
    id?: string;
    type?: string;
    episodeId?: string;
    imdbId?: string;
    availableStreams?: { [providerId: string]: { streams: any[]; addonName: string } };
    backdrop?: string;
    videoType?: string;
  };
  Catalog: { id: string; type: string; addonId?: string; name?: string; genreFilter?: string };
  Credits: { mediaId: string; mediaType: string };
  ShowRatings: { showId: number };
  Account: undefined;
  AccountManage: undefined;
  Payment: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
  Addons: undefined;
  CatalogSettings: undefined;
  NotificationSettings: undefined;
  MDBListSettings: undefined;
  TMDBSettings: undefined;
  HomeScreenSettings: undefined;
  HeroCatalogs: undefined;
  TraktSettings: undefined;
  PlayerSettings: undefined;
  ThemeSettings: undefined;
  ScraperSettings: undefined;
  CastMovies: {
    castMember: {
      id: number;
      name: string;
      profile_path: string | null;
      character?: string;
    };
  };
  AISettings: undefined;
  AIChat: {
    contentId: string;
    contentType: 'movie' | 'series';
    episodeId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    title: string;
  };
  BackdropGallery: {
    tmdbId: number;
    type: 'movie' | 'tv';
    title: string;
  };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tab navigator types
export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Search: undefined;
  Downloads: undefined;
  Settings: undefined;
};

// Custom fonts that satisfy both theme types
const fonts = {
  regular: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: 'sans-serif',
    fontWeight: '700' as const,
  },
  heavy: {
    fontFamily: 'sans-serif',
    fontWeight: '900' as const,
  },
  // MD3 specific fonts
  displayLarge: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
    fontSize: 57,
  },
  displayMedium: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
    fontSize: 45,
  },
  displaySmall: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
    fontSize: 36,
  },
  headlineLarge: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
    fontSize: 32,
  },
  headlineMedium: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
    fontSize: 28,
  },
  headlineSmall: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
    fontSize: 24,
  },
  titleLarge: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
    fontSize: 22,
  },
  titleMedium: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  titleSmall: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
    fontSize: 14,
  },
  labelLarge: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
    fontSize: 14,
  },
  labelMedium: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    fontSize: 12,
  },
  labelSmall: {
    fontFamily: 'sans-serif-medium',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    fontSize: 11,
  },
  bodyLarge: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: 'sans-serif',
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
    fontSize: 12,
  },
} as const;

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Create custom paper themes
export const CustomLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
  },
  fonts: MD3LightTheme.fonts,
};

export const CustomDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
  },
  fonts: MD3DarkTheme.fonts,
};

// Create custom navigation theme
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Add fonts to navigation themes
export const CustomNavigationLightTheme: Theme = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    background: colors.white,
    card: colors.white,
    text: colors.textDark,
    border: colors.border,
  },
  fonts,
};

export const CustomNavigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.darkBackground,
    card: colors.darkBackground,
    text: colors.text,
    border: colors.border,
  },
  fonts,
};

type IconNameType = string;

// Add TabIcon component
const TabIcon = React.memo(({ focused, color, iconName, iconLibrary = 'material' }: { 
  focused: boolean; 
  color: string; 
  iconName: IconNameType;
  iconLibrary?: 'material' | 'feather' | 'ionicons';
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100
    }).start();
  }, [focused]);

  // Use outline variant when available for Material icons; Feather has single-form icons
  const finalIconName = (() => {
    if (iconLibrary === 'feather') {
      return iconName;
    }
    if (iconName === 'magnify') return 'magnify';
    return focused ? iconName : `${iconName}-outline` as IconNameType;
  })();

  return (
    <Animated.View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      transform: [{ scale: scaleAnim }]
    }}>
      {iconLibrary === 'feather' ? (
        <Feather 
          name={finalIconName as any}
          size={24} 
          color={color} 
        />
      ) : iconLibrary === 'ionicons' ? (
        <Ionicons 
          name={finalIconName as any}
          size={24}
          color={color}
        />
      ) : (
        <MaterialCommunityIcons 
          name={finalIconName as any}
          size={24} 
          color={color} 
        />
      )}
    </Animated.View>
  );
});

// Update the TabScreenWrapper component with fixed layout dimensions
const TabScreenWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const isTablet = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const smallestDimension = Math.min(width, height);
    return (Platform.OS === 'ios' ? (Platform as any).isPad === true : smallestDimension >= 768);
  }, []);
  const insets = useSafeAreaInsets();
  // Force consistent status bar settings
  useEffect(() => {
    const applyStatusBarConfig = () => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    };
    
    applyStatusBarConfig();
    
    // Apply status bar config on every focus
    const subscription = Platform.OS === 'android' 
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            applyStatusBarConfig();
          }
        })
      : { remove: () => {} };
      
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.darkBackground,
      // Lock the layout to prevent shifts
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Reserve consistent space for the header area on all screens */}
      <View style={{ 
        height: isTablet ? (insets.top + 64) : (Platform.OS === 'android' ? 80 : 60), 
        width: '100%', 
        backgroundColor: colors.darkBackground,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: -1
      }} />
      {children}
    </View>
  );
};

// Add this component to wrap each screen in the tab navigator
const WrappedScreen: React.FC<{Screen: React.ComponentType<any>}> = ({ Screen }) => {
  return (
    <TabScreenWrapper>
      <Screen />
    </TabScreenWrapper>
  );
};

// Tab Navigator
const MainTabs = () => {
  const { currentTheme } = useTheme();
  const { settings } = require('../hooks/useSettings');
  const { useSettings: useSettingsHook } = require('../hooks/useSettings');
  const { settings: appSettings } = useSettingsHook();
  const [hasUpdateBadge, setHasUpdateBadge] = React.useState(false);
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    let mounted = true;
    const load = async () => {
      try {
        const flag = await AsyncStorage.getItem('@update_badge_pending');
        if (mounted) setHasUpdateBadge(flag === 'true');
      } catch {}
    };
    load();
    // Fast poll initially for quick badge appearance, then slow down
    const fast = setInterval(load, 800);
    const slowTimer = setTimeout(() => {
      clearInterval(fast);
      const slow = setInterval(load, 10000);
      // store slow interval id on closure for cleanup
      (load as any)._slow = slow;
    }, 6000);
    const onAppStateChange = (state: string) => {
      if (state === 'active') load();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => {
      mounted = false;
      clearInterval(fast);
      // @ts-ignore
      if ((load as any)._slow) clearInterval((load as any)._slow);
      clearTimeout(slowTimer);
      sub.remove();
    };
  }, []);
  const { isHomeLoading } = useLoading();
  const isTablet = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const smallestDimension = Math.min(width, height);
    return (Platform.OS === 'ios' ? (Platform as any).isPad === true : smallestDimension >= 768);
  }, []);
  const insets = useSafeAreaInsets();
  const isIosTablet = Platform.OS === 'ios' && isTablet;
  const [hidden, setHidden] = React.useState(HeaderVisibility.isHidden());
  React.useEffect(() => HeaderVisibility.subscribe(setHidden), []);
  // Smooth animate header hide/show
  const headerAnim = React.useRef(new Animated.Value(0)).current; // 0: shown, 1: hidden
  React.useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: hidden ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, headerAnim]);
  const translateY = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const fade = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  
  const renderTabBar = (props: BottomTabBarProps) => {
    // Hide tab bar when home is loading
    if (isHomeLoading) {
      return null;
    }

    // Get current route name to determine if we should keep navigation fixed
    const currentRoute = props.state.routes[props.state.index]?.name;
    const shouldKeepFixed = currentRoute === 'Search' || currentRoute === 'Library';

    if (isTablet) {
      // Top floating, text-only pill nav for tablets
      return (
        <Animated.View
        style={[{
          position: 'absolute',
          top: insets.top + 12,
          left: 0,
          right: 0,
          alignItems: 'center',
          backgroundColor: 'transparent',
          zIndex: 100,
        }, shouldKeepFixed ? {} : {
          transform: [{ translateY }],
          opacity: fade,
        }]}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 28,
            overflow: 'hidden',
            padding: 4,
            position: 'relative',
            backgroundColor: isIosTablet ? 'transparent' : 'rgba(0,0,0,0.7)'
          }}>
            {isIosTablet && (
              GlassViewComp && liquidGlassAvailable ? (
                <GlassViewComp
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 28,
                  }}
                  glassEffectStyle="clear"
                />
              ) : (
                <BlurView
                  tint="dark"
                  intensity={75}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 28,
                  }}
                />
              )
            )}
            {props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.8}
                  onPress={onPress}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    marginHorizontal: 2,
                    borderRadius: 24,
                    backgroundColor: isFocused ? 'rgba(255,255,255,0.12)' : 'transparent',
                  }}
                >
                  <Text style={{
                    color: isFocused ? currentTheme.colors.primary : currentTheme.colors.white,
                    fontWeight: '700',
                    fontSize: 14,
                    letterSpacing: 0.2,
                  }}>
                    {typeof label === 'string' ? label : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      );
    }

    // Default bottom tab for phones
    return (
      <View style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        height: 85,
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}>
        {Platform.OS === 'ios' ? (
          GlassViewComp && liquidGlassAvailable ? (
            <GlassViewComp
              style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
              }}
              glassEffectStyle="clear"
            />
          ) : (
            <BlurView
              tint="dark"
              intensity={75}
              style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
                borderTopColor: currentTheme.colors.border,
                borderTopWidth: 0.5,
                shadowColor: currentTheme.colors.black,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              }}
            />
          )
        ) : (
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0.65)',
              'rgba(0, 0, 0, 0.85)',
              'rgba(0, 0, 0, 0.98)',
            ]}
            locations={[0, 0.2, 0.4, 0.8]}
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
            }}
          />
        )}
        <View
          style={{
            height: '100%',
            paddingBottom: 20,
            paddingTop: 12,
            backgroundColor: 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', paddingTop: 4 }}>
            {props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              let iconName: IconNameType = 'home';
              let iconLibrary: 'material' | 'feather' | 'ionicons' = 'material';
              switch (route.name) {
                case 'Home':
                  iconName = 'home';
                  iconLibrary = 'feather';
                  break;
                case 'Library':
                  iconName = 'library';
                  iconLibrary = 'ionicons';
                  break;
                case 'Search':
                  iconName = 'search';
                  iconLibrary = 'feather';
                  break;
                case 'Downloads':
                  iconName = 'download';
                  iconLibrary = 'feather';
                  break;
                case 'Settings':
                  iconName = 'settings';
                  iconLibrary = 'feather';
                  break;
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.7}
                  onPress={onPress}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                  }}
                >
                  <TabIcon 
                    focused={isFocused} 
                    color={isFocused ? currentTheme.colors.primary : currentTheme.colors.white} 
                    iconName={iconName}
                    iconLibrary={iconLibrary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      marginTop: 4,
                      color: isFocused ? currentTheme.colors.primary : currentTheme.colors.white,
                      opacity: isFocused ? 1 : 0.7,
                    }}
                  >
                    {typeof label === 'string' ? label : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };
  
  // iOS: Use native bottom tabs (@bottom-tabs/react-navigation)
  if (Platform.OS === 'ios') {
    // Dynamically require to avoid impacting Android bundle
    const { createNativeBottomTabNavigator } = require('@bottom-tabs/react-navigation');
    const IOSTab = createNativeBottomTabNavigator();

    return (
      <View style={{ flex: 1, backgroundColor: currentTheme.colors.darkBackground }}>
        <StatusBar
          translucent
          barStyle="light-content"
          backgroundColor="transparent"
        />
        <IOSTab.Navigator
          // Native tab bar handles its own visuals; keep options minimal
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: currentTheme.colors.primary,
            tabBarInactiveTintColor: currentTheme.colors.white,
            translucent: true,
            // Prefer native lazy/freeze when available; still pass for parity
            lazy: true,
            freezeOnBlur: true,
          }}
        >
          <IOSTab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Home',
              tabBarIcon: () => ({ sfSymbol: 'house' }),
            }}
          />
          <IOSTab.Screen
            name="Library"
            component={LibraryScreen}
            options={{
              title: 'Library',
              tabBarIcon: () => ({ sfSymbol: 'heart' }),
            }}
          />
          <IOSTab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              title: 'Search',
              tabBarIcon: () => ({ sfSymbol: 'magnifyingglass' }),
            }}
          />
          {appSettings?.enableDownloads !== false && (
            <IOSTab.Screen
              name="Downloads"
              component={DownloadsScreen}
              options={{
                title: 'Downloads',
                tabBarIcon: () => ({ sfSymbol: 'arrow.down.circle' }),
              }}
            />
          )}
          <IOSTab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              tabBarIcon: () => ({ sfSymbol: 'gear' }),
            }}
          />
        </IOSTab.Navigator>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.colors.darkBackground }}>
      {/* Common StatusBar for all tabs */}
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />
      
      <Tab.Navigator
        tabBar={renderTabBar}
        screenOptions={({ route, navigation, theme }) => ({
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 200,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
            },
          },
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  scale: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.95, 1, 0.95],
                  }),
                },
                {
                  translateY: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [8, 0, 8],
                  }),
                },
              ],
            },
          }),
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: currentTheme.colors.darkBackground,
          },
          // Ensure background tabs are frozen and detached
          freezeOnBlur: true,
          lazy: true,
          detachInactiveScreens: true,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarLabel: 'Library',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={'magnify'} size={size} color={color} />
            ),
          }}
        />
        {appSettings?.enableDownloads !== false && (
          <Tab.Screen
            name="Downloads"
            component={DownloadsScreen}
            options={{
              tabBarLabel: 'Downloads',
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons name={focused ? 'download' : 'download-outline'} size={size} color={color} />
              ),
            }}
          />
        )}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'cog' : 'cog-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Create custom fade animation interpolator for MetadataScreen
const customFadeInterpolator = ({ current, layouts }: any) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
      }),
    },
  };
};

// Stack Navigator
const InnerNavigator = ({ initialRouteName }: { initialRouteName?: keyof RootStackParamList }) => {
  const { currentTheme } = useTheme();
  const { user, loading } = useAccount();
  const insets = useSafeAreaInsets();
  
  // Handle Android-specific optimizations
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Ensure consistent background color for Android
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setTranslucent(true);
    }
  }, []);
  
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <PaperProvider theme={CustomDarkTheme}>
        <View style={{ 
          flex: 1, 
          backgroundColor: currentTheme.colors.darkBackground,
          ...(Platform.OS === 'android' && {
            // Prevent white flashes on Android
            opacity: 1,
          })
        }}>
          <Stack.Navigator
            initialRouteName={initialRouteName || 'MainTabs'}
            screenOptions={{
              headerShown: false,
              // Use slide_from_right for consistency and smooth transitions
              animation: Platform.OS === 'android' ? 'slide_from_right' : 'slide_from_right',
              animationDuration: Platform.OS === 'android' ? 250 : 300,
              // Ensure consistent background during transitions
              contentStyle: {
                backgroundColor: currentTheme.colors.darkBackground,
              },
              // Improve Android performance with custom interpolator
              ...(Platform.OS === 'android' && {
                cardStyleInterpolator: ({ current, layouts }: any) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateX: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [layouts.screen.width, 0],
                          }),
                        },
                      ],
                      backgroundColor: currentTheme.colors.darkBackground,
                    },
                  };
                },
              }),
            }}
          >
            <Stack.Screen
              name="Account"
              component={AuthScreen as any}
              options={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: currentTheme.colors.darkBackground },
              }}
            />
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs as any} 
              options={{
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen
              name="AccountManage"
              component={AccountManageScreen as any}
              options={{
                headerShown: false,
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="Metadata" 
              component={MetadataScreen}
              options={{ 
                headerShown: false, 
                animation: Platform.OS === 'android' ? 'none' : 'fade',
                animationDuration: Platform.OS === 'android' ? 0 : 300,
                ...(Platform.OS === 'ios' && {
                  cardStyleInterpolator: customFadeInterpolator,
                  animationTypeForReplace: 'push',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }),
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="Streams" 
              component={StreamsScreen as any} 
              options={{
                headerShown: false,
                animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'none',
                animationDuration: Platform.OS === 'android' ? 0 : 300,
                gestureEnabled: true,
                gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
                ...(Platform.OS === 'ios' && { presentation: 'modal' }),
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
                // Freeze when blurred to stop timers/network without full unmount
                freezeOnBlur: true,
              }}
            />
            <Stack.Screen 
              name="PlayerIOS" 
              component={KSPlayerCore as any} 
              options={{ 
                animation: 'default',
                animationDuration: 0,
                // Force fullscreen presentation on iPad
                presentation: 'fullScreenModal',
                // Disable gestures during video playback
                gestureEnabled: false,
                // Ensure proper orientation handling
                orientation: 'landscape',
                contentStyle: {
                  backgroundColor: '#000000', // Pure black for video player
                },
                // iPad-specific fullscreen options
                statusBarHidden: true,
                statusBarAnimation: 'none',
                // Freeze when blurred to release resources safely
                freezeOnBlur: true,
              }}
            />
            <Stack.Screen 
              name="PlayerAndroid" 
              component={AndroidVideoPlayer as any} 
              options={{ 
                animation: 'none',
                animationDuration: 0,
                presentation: 'card',
                // Disable gestures during video playback
                gestureEnabled: false,
                // Ensure proper orientation handling
                orientation: 'landscape',
                contentStyle: {
                  backgroundColor: '#000000', // Pure black for video player
                },
                // Freeze when blurred to release resources safely
                freezeOnBlur: true,
              }}
            />
            <Stack.Screen 
              name="Catalog" 
              component={CatalogScreen as any} 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="Addons" 
              component={AddonsScreen as any} 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen as any} 
              options={{ 
                animation: Platform.OS === 'android' ? 'none' : 'fade',
                animationDuration: Platform.OS === 'android' ? 0 : 350,
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="CatalogSettings" 
              component={CatalogSettingsScreen as any} 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="HomeScreenSettings" 
              component={HomeScreenSettings}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="HeroCatalogs" 
              component={HeroCatalogsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="ShowRatings" 
              component={ShowRatingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'fade',
                animationDuration: Platform.OS === 'android' ? 200 : 200,
                ...(Platform.OS === 'ios' && { presentation: 'modal' }),
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: 'transparent',
                },
              }}
            />
            <Stack.Screen 
              name="Calendar" 
              component={CalendarScreen as any} 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen as any} 
              options={{ 
                animation: 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="MDBListSettings" 
              component={MDBListSettingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="TMDBSettings" 
              component={TMDBSettingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="TraktSettings" 
              component={TraktSettingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="PlayerSettings" 
              component={PlayerSettingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="ThemeSettings" 
              component={ThemeScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="ScraperSettings" 
              component={PluginsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="CastMovies" 
              component={CastMoviesScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
                animationDuration: Platform.OS === 'android' ? 250 : 200,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen 
              name="Update" 
              component={UpdateScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen
              name="AISettings"
              component={AISettingsScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />

            <Stack.Screen
              name="Backup"
              component={BackupScreen}
              options={{
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 250 : 300,
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen
              name="AIChat"
              component={AIChatScreen}
              options={{
                animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
                animationDuration: Platform.OS === 'android' ? 220 : 300,
                presentation: Platform.OS === 'ios' ? 'fullScreenModal' : 'modal',
                gestureEnabled: true,
                gestureDirection: Platform.OS === 'ios' ? 'horizontal' : 'vertical',
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.darkBackground,
                },
              }}
            />
            <Stack.Screen
              name="BackdropGallery"
              component={BackdropGalleryScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#000',
                },
              }}
            />
          </Stack.Navigator>
        </View>
      </PaperProvider>
      {/* Global toast customization using ThemeContext */}
      <ToastManager
        position="top"
        useModal={false}
        theme={'dark'}
        // Dimensions
        width={'90%'}
        minHeight={61}
        // Icon defaults
        iconFamily="MaterialIcons"
        iconSize={22}
        icons={{
          success: 'check-circle',
          error: 'error',
          info: 'info',
          warn: 'warning',
          default: 'notifications',
        }}
        // Close icon defaults
        showCloseIcon={true}
        closeIcon={'close'}
        closeIconFamily={'MaterialIcons'}
        closeIconSize={18}
        // Spacing (ensure below safe area)
        topOffset={Math.max(8, insets.top + 8)}
        bottomOffset={40}
        // Styles bound to ThemeContext
        style={{
          backgroundColor: currentTheme.colors.darkBackground,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
        textStyle={{
          color: currentTheme.colors.highEmphasis,
          fontWeight: '600',
        }}
        config={{
          default: (props: any) => (
            <View style={{
              backgroundColor: currentTheme.colors.elevation2,
              borderRadius: 12,
              padding: 12,
              width: '100%'
            }}>
              <Text style={{ color: currentTheme.colors.highEmphasis, fontWeight: '700' }}>{props.text1}</Text>
              {props.text2 ? (
                <Text style={{ color: currentTheme.colors.mediumEmphasis, marginTop: 4 }}>{props.text2}</Text>
              ) : null}
            </View>
          ),
          success: (props: any) => (
            <View style={{
              backgroundColor: currentTheme.colors.elevation2,
              borderRadius: 12,
              padding: 12,
              width: '100%'
            }}>
              <Text style={{ color: currentTheme.colors.success || '#4CAF50', fontWeight: '800' }}>{props.text1}</Text>
              {props.text2 ? (
                <Text style={{ color: currentTheme.colors.mediumEmphasis, marginTop: 4 }}>{props.text2}</Text>
              ) : null}
            </View>
          ),
          error: (props: any) => (
            <View style={{
              backgroundColor: currentTheme.colors.elevation2,
              borderRadius: 12,
              padding: 12,
              width: '100%'
            }}>
              <Text style={{ color: currentTheme.colors.error || '#ff4444', fontWeight: '800' }}>{props.text1}</Text>
              {props.text2 ? (
                <Text style={{ color: currentTheme.colors.mediumEmphasis, marginTop: 4 }}>{props.text2}</Text>
              ) : null}
            </View>
          ),
        }}
      />
    </SafeAreaProvider>
  );
};

const AppNavigator = ({ initialRouteName }: { initialRouteName?: keyof RootStackParamList }) => (
  <PostHogProvider 
    apiKey="phc_sk6THCtV3thEAn6cTaA9kL2cHuKDBnlYiSL40ywdS6C" 
    options={{
      host: "https://us.i.posthog.com",
    }}
  >
    <LoadingProvider>
      <InnerNavigator initialRouteName={initialRouteName} />
    </LoadingProvider>
  </PostHogProvider>
);

export default AppNavigator;