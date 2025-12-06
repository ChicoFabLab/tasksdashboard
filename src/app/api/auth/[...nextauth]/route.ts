import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import PocketBase from 'pocketbase';

// Admin role names that grant access
const ADMIN_ROLES = ["Zone Leader"];
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // When user first logs in
      if (account && account.access_token && profile) {
        // Check if volunteer exists in PocketBase
        try {
          const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

          // Extract Discord ID safely
          const discordId = (profile as any).id || token.sub;

          try {
            // Try to find volunteer by discord_id
            const volunteer = await pb.collection('volunteers').getFirstListItem(
              `discord_id = "${discordId}"`
            );

            // Volunteer exists - add to token
            token.volunteerId = volunteer.id;
            token.needsRegistration = false;
          } catch (err) {
            // Volunteer doesn't exist - needs registration
            token.needsRegistration = true;
          }

          // Fetch Discord roles
          try {
            const response = await fetch(
              `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                },
              }
            );

            if (response.ok) {
              const memberData = await response.json();
              const roleIds = memberData.roles || [];

              // Fetch guild roles to get role names
              const guildResponse = await fetch(
                `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
                {
                  headers: {
                    Authorization: `Bot ${process.env.DISCORD_CLIENT_SECRET}`,
                  },
                }
              );

              if (guildResponse.ok) {
                const guildRoles = await guildResponse.json();
                const userRoleNames = guildRoles
                  .filter((role: any) => roleIds.includes(role.id))
                  .map((role: any) => role.name);

                // Check if user has any admin roles
                token.isAdmin = userRoleNames.some((roleName: string) =>
                  ADMIN_ROLES.includes(roleName)
                );
                token.roles = userRoleNames;
              }
            }
          } catch (error) {
            console.error("Error fetching Discord roles:", error);
            token.isAdmin = false;
            token.roles = [];
          }
        } catch (error) {
          console.error("Error checking PocketBase:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).volunteerId = token.volunteerId;
        (session.user as any).needsRegistration = token.needsRegistration || false;
        (session.user as any).isAdmin = token.isAdmin || false;
        (session.user as any).roles = token.roles || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
