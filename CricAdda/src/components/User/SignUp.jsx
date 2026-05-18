import React, { useContext, useState } from "react";
import UniversalContext from "../../context/UniversalContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api";

export default function Signup() {
  const { setToggler } = useContext(UniversalContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setError('You are already logged in on this device.')
      setTimeout(() => navigate('/'), 1500)
    }
  }, [navigate])

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  const password = watch("Password")
  const onsubmit = async(data) => {
    setLoading(true)
    setError("")
    try{
    const response = await fetch(`${API_URL}/user/Signup`,{
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify({
        Fullname : data.Fullname,
        Email : data.Email,
        Password : data.Password,
      })
    })
    const result = await response.json()

    if (response.ok) {
      localStorage.setItem('token',result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('userId', result.user._id)
      localStorage.setItem('userName', result.user.Fullname)
      console.log("Signup successful")
      reset()
      navigate('/')
    }else{
      setError(result.message || "signup failed")
    }
  }catch(err){
    setError("Error:"+ err.message)
  }finally{
    setLoading(false)
  } 

  }

  const [showPassword, setShowPassword] = useState(false)
  const [confirmShowPassword, setConfirmShowPassword] = useState(false)

  
  return (


    <div className="min-h-screen select-none flex items-center justify-center bg-linear-to-br from-[#0B1220] via-[#111827] to-[#020617] px-4">

      <div className="w-full max-w-sm sm:max-w-md bg-linear-to-b from-[#121a2b] to-[#0B1220] p-6 sm:p-8 rounded-2xl border border-gray-700 shadow-xl text-white">

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(onsubmit)} className="space-y-4 flex flex-col gap-4">

          {error && (
            <p className="bg-red-600 text-white p-3 rounded-lg text-center" role="alert">{error}</p>
          )}

          {/* Full name */}

          <input
            type="text"
            placeholder="Full Name"
            {...register("Fullname", { required: true, maxLength: 20 })}
            aria-invalid={errors.Fullname ? "true" : 'false'}
            className={`w-full p-3 rounded-lg bg-[#0B1220] border border-gray-600 focus:outline-none focus:border-blue-500 ${errors.Fullname ? 'border-red-500' : 'border-gray-600'}`}
          />
          {errors.Fullname?.type === "required" && (
            <p className=" text-red-600" role="alert">Full name required</p>
          )}

          {/* Email  */}

          <input
            type="email"
            placeholder="Email"
            {...register("Email", { 
              required: true,
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" }
            })}
            aria-invalid={errors.Email ? "true" : "false"}
            autoComplete="email"
            className={`w-full p-3 rounded-lg bg-[#0B1220] border border-gray-600 focus:outline-none focus:border-blue-500 ${errors.Email ? 'border-red-500' : 'border-gray-600'}`}
          />
          {errors.Email?.type === "required" && (
            <p className="text-red-600" role="alert">Email required</p>
          )}
          {errors.Email?.type === "pattern" && (
            <p className="text-red-600" role="alert">{errors.Email.message}</p>
          )}

          {/* password */}

          <div className="relative">
            <input
              type={!showPassword ? "password" : "text"}
              placeholder="Password"
              {...register("Password", {
                required: true,
                minLength: { value: 8, message: "Password must be at least 8 characters" },
              })}
              aria-invalid={errors.Password ? "true" : "false"}
              className={`w-full p-3 rounded-lg bg-[#0B1220] border border-gray-600 focus:outline-none focus:border-purple-500 ${errors.Password ? 'border-red-500' : 'border-gray-600'}`}

            />
            <button type="button" onClick={(e)=>{e.preventDefault(); setShowPassword(prev => !prev)}} className="absolute right-2 top-3 focus:outline-none">{!showPassword ? <i className="ri-eye-line"></i> : <i className="ri-eye-off-line"></i>}</button>
          </div>
          {errors.Password?.type === "required" && (
            <p className="text-red-600" role="alert">Password required</p>
          )}
          {errors.Password?.type === "minLength" && (
            <p className="text-red-600" role="alert">{errors.Password.message}</p>
          )}

          {/* ConfirmPassword */}

          <div className="relative">
            <input
            type={!confirmShowPassword ? "password" : "text"}
            placeholder="Confirm Password"
            {...register("ConfirmPassword", { required: true, validate: (value) => value === password || "Passwords do not match" })}
            aria-invalid={errors.ConfirmPassword ? "true" : "false"}
            autoComplete="new-password"
            className={`w-full p-3 rounded-lg bg-[#0B1220] border border-gray-600 focus:outline-none focus:border-purple-500 ${errors.ConfirmPassword ? 'border-red-500' : 'border-gray-600'}`}
          />
          <button type="button" onClick={(e)=>{e.preventDefault(); setConfirmShowPassword(prev => !prev)}} className="absolute right-2 top-3 focus:outline-none">{!confirmShowPassword ? <i className="ri-eye-line"></i> : <i className="ri-eye-off-line"></i>}</button>
          </div>
          {errors.ConfirmPassword?.type === "required" && (
            <p className="text-red-600" role="alert">Confirm password required</p>
          )}
          {errors.ConfirmPassword?.type === "validate" && (
            <p className="text-red-600" role="alert">{errors.ConfirmPassword.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-green-400 to-green-600 py-3 rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

        </form>

        <p className="text-center text-gray-400 mt-6">

          Already have an account?  .

          <button onClick={() => setToggler(prev => !prev)}
            className="text-blue-400 ml-2 hover:underline"
          >
            Login
          </button>

        </p>

      </div>

    </div>

  );

}