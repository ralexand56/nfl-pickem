-- Drop the old unique index
DROP INDEX IF EXISTS picks_user_game_unique;

-- Add a proper unique constraint instead
ALTER TABLE picks ADD CONSTRAINT picks_user_game_unique UNIQUE (user_id, game_id);
