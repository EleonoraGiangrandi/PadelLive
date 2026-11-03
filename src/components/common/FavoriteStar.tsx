import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useFavoritesStore, normalizePlayerName, matchesPlayerName } from '../../store/useFavoritesStore';
import { PlayerRanking, FavoritePlayer } from '../../types/models';

interface FavoriteStarProps {
  player: PlayerRanking | FavoritePlayer | { id?: string; name: string; handler?: string; [key: string]: any };
  size?: number;
  style?: ViewStyle;
  onToggled?: (isFav: boolean) => void;
}

export const FavoriteStar: React.FC<FavoriteStarProps> = ({
  player,
  size = 20,
  style,
  onToggled,
}) => {
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const isFav = useMemo(() => {
    if (!player) return false;
    const playerId = (player as any).handler || player.id;
    const cleanName = player.name ? normalizePlayerName(player.name) : '';

    return favorites.some((f) => {
      if (playerId && f.id === playerId) return true;
      if (f.handler && (player as any).handler && f.handler === (player as any).handler) return true;
      if (cleanName && normalizePlayerName(f.name) === cleanName) return true;
      if (player.name && f.name && matchesPlayerName(player.name, f.name)) return true;
      return false;
    });
  }, [favorites, player]);

  const handlePress = async () => {
    const nextState = await toggleFavorite(player as any);
    if (onToggled) {
      onToggled(nextState);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[styles.btn, style]}
    >
      <Text style={[styles.starIcon, { fontSize: size, color: isFav ? '#f59e0b' : '#64748b' }]}>
        {isFav ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  starIcon: {
    lineHeight: 22,
  },
});
