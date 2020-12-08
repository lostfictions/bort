import React from "react";
import Link from "next/link";
import { css } from "astroturf";

import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

const getAvatar = (id: string, avatarId?: string | null) => {
  if (!avatarId) {
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(id) % 5}.png`;
  }
  const ext = avatarId.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${avatarId}.${ext}`;
};

interface User {
  id: string;
  avatar: string;
  username: string;
}

const { button, icongroup, avatar } = css`
  .button {
    color: black;
    border: 1px solid black;
    background-color: white;
    display: inline-block;
  }

  .icongroup {
    display: flex;
    flex-direction: column;
    width: 96px;
    align-items: center;
  }

  .avatar {
    border-radius: 50%;
  }
`;

const UserIcon = ({ user }: { user?: User }) => {
  let icon;
  if (user) {
    icon = (
      <div className={icongroup}>
        <img className={avatar} src={getAvatar(user.id, user.avatar)} />
        <span>{user.username}</span>
      </div>
    );
  } else {
    icon = (
      <div>
        <a href="/api/login?return_to=/">login</a>
      </div>
    );
  }

  return <div>{icon}</div>;
};

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const Index: React.FC<Props> = () => {
  return (
    <div>
      <Link href="/other">
        <a>meets</a>
      </Link>
      <div className={button}>greets</div>
      <UserIcon />
    </div>
  );
};

// FIXME
export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: {} };
};

export default Index;
