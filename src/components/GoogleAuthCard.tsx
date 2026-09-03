import React from 'react';
import { ShieldCheck, LogOut, CheckCircle2, User as UserIcon, Key } from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleAuthCardProps {
  user: User | null;
  hasToken: boolean;
  isLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GoogleAuthCard: React.FC<GoogleAuthCardProps> = ({
  user,
  hasToken,
  isLoading,
  onSignIn,
  onSignOut
}) => {
  if (user && hasToken) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border-2 border-indigo-500/50 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">
                {user.displayName || user.email || 'Connected Account'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Workspace Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Calendar • Tasks • Chat • Meet</span>
          </div>
          <button
            id="google-sign-out-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Google Workspace Connection Required</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Connect your Google account with permission to access and synchronize your Google Calendar events, Google Tasks, Google Chat spaces, and Google Meet video calls.
          </p>
        </div>

        {/* Official GSI Style Button */}
        <button
          id="google-sign-in-btn"
          onClick={onSignIn}
          disabled={isLoading}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-xs shadow-md hover:shadow-lg transition-all border border-slate-200 disabled:opacity-50 flex-shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-4 h-4 block"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              ></path>
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              ></path>
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              ></path>
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              ></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
};
