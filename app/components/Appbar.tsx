"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";

const Appbar = () => {
  const session = useSession();
  return (
    <div className="flex justify-between p-4 bg-gray-800 rounded-md m-3 px-5">
      <div>Musica</div>
      <div>
        {session.data?.user && (
          <button onClick={() => signOut()}>Signout</button>
        )}
        {!session.data?.user && (
          <button onClick={() => signIn()}>Singin</button>
        )}
      </div>
    </div>
  );
};

export default Appbar;
