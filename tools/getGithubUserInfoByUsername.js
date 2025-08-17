import axios from 'axios';

export default async function getGithubUserInfoByUsername(username = "") {
    const url = `https://api.github.com/users/${username.toLowerCase()}`;
    const { data } = await axios.get(url);
    return JSON.stringify({
        login: data.login,
        id: data.id,
        name: data.name,
        location: data.location,
        twitter_username: data.twitter_username,
        public_repos: data.public_repos,
        public_gists: data.public_gists,
        user_view_type: data.user_view_type,
        followers: data.followers,
        following: data.following,
    });
}